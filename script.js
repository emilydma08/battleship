/* FACTORY FUNCTIONS */

/* returns {length, positions, hit, isSunk} */
function ship (shipLength){
    const length = shipLength;
    const positions = [];
    let hits = 0;
    

    const hit = () => hits++;
    const isSunk = () => hits == length;

    return {length, positions, hit, isSunk};
}

/* returns {board, ships, missedShots, placeShip, receiveAttack, allShipsSunk} */
function gameboard () {
    const board = Array.from({ length: 10 }, () => Array(10).fill(null));
    const ships = [];
    const missedShots = [];

    const isPlacementValid = (ship, x, y, direction) => {
        for (let i = 0; i < ship.length; i++) {
            const row = direction === "y" ? x + i : x;
            const col = direction === "x" ? y + i : y;
            /*console.log(`Checking cell [${row}][${col}] - currently:`, board[row][col]);*/
            if (row >= 10 || col >= 10 || board[row][col] !== null) {
                console.log(`Invalid placement at [${row}][${col}]`);
                return false;
            }
        }
        return true;
    };

    const placeShip = (ship, x, y, direction) => {
        if (!isPlacementValid(ship, x, y, direction)) {
            console.log("Invalid placement detected in placeShip()");
            throw new Error("Invalid ship placement");
        }
        
        ships.push(ship);
        for (let i = 0; i < ship.length; i++){
            if (direction === "y"){
                board[x+i][y] = ship;
                ship.positions.push([x+i, y]);
            } else if (direction === "x"){
                board[x][y+i] = ship;
                ship.positions.push([x, y+i]);
            }
        }
    };

    const receiveAttack = (x, y) => {        
        const target = board[x][y];

        if (target && (target.hit || target.miss)) return;

        if (target && typeof target.hit === "function") {
            target.hit();
            board[x][y] = { ship: target, hit: true };
        } else {
            board[x][y] = { miss: true };
            missedShots.push([x, y]);
        }
    };

    const allShipsSunk = () => {
        for (let i = 0; i < ships.length; i++){
            if (!ships[i].isSunk()){
                return false;
            }
        }
        return true;
    }

    return {board, ships, missedShots, placeShip, receiveAttack, allShipsSunk};
}

/* returns {playerShips, playerBoard} */
function player (ships, board) {
    const playerShips = ships;
    const playerBoard = board;

    return {playerShips, playerBoard};
}



/* GAMEPLAY FUNCTIONS */

/* returns player1, player2 */
function setUp(){
    const shipLengths = [2, 3, 3, 4, 5];

    const player1ships = [];
    const player2ships = [];
    for (let i = 0; i < shipLengths.length; i++){
        player1ships.push(ship(shipLengths[i]));
        player2ships.push(ship(shipLengths[i]));
    }

    const player1 = player(player1ships, gameboard());
    const player2 = player(player2ships, gameboard());

    return {player1, player2};
}

async function placeShips(player, boxId) {
    const ships = player.playerShips;
    const board = player.playerBoard;

    for (let i = 0; i < ships.length; i++) {
        let placed = false;
        while (!placed) {
            displayInstructions("Mark ship of length " + ships[i].length + "'s starting box and select direction");

            const startBox = await new Promise((resolve) => {
                function onClick(event) {
                    if (!event.target.classList.contains(boxId)) return;

                    boxes.forEach(box => box.removeEventListener('click', onClick));

                    event.target.textContent = "X";

                    const x = parseInt(event.target.getAttribute('data-x'), 10);
                    const y = parseInt(event.target.getAttribute('data-y'), 10);

                    resolve({ x, y, boxElement: event.target });
                }

                const boxes = document.querySelectorAll(`.${boxId}`);

                boxes.forEach(box => box.addEventListener('click', onClick));
            });

            const direction = await displayDirectionButtons();

            startBox.boxElement.textContent = "";

            try {
                console.log('Placing ship of length ' + ships[i].length);
                board.placeShip(ships[i], startBox.x, startBox.y, direction);
                placed = true;
            } catch (e) {
                displayInstructions("Invalid placement, try again.");
                console.log('Invalid plaecment, try again');
                // loop continues, re-prompting the player
            }
        }
    }
}




/* DOM FUNCTIONS */
const turnText = document.getElementById("playerId");
function toggleTurn(){
    if (turnText.textContent ===  "1"){
        turnText.textContent = "2";
    } else {
        turnText.textContent =  "1";
    }
}

const instructions = document.getElementById("instructions");
function displayInstructions(text){
    instructions.textContent = text;
}

/* returns "x" or "y" */
const gameTextDiv = document.getElementById("buttons");
function displayDirectionButtons(){
    return new Promise((resolve) => {
        const container = gameTextDiv;

        const button1 = document.createElement('button');
        button1.textContent = "Horizontal";
        button1.value = "x";
        button1.style.marginRight = '10px';

        const button2 = document.createElement('button');
        button2.textContent = "Vertical";
        button2.value = "y";

        function handleClick(event) {
            const choice = event.target.value;

            container.removeChild(button1);
            container.removeChild(button2);

            resolve(choice);
        }

        button1.addEventListener('click', handleClick);
        button2.addEventListener('click', handleClick);

        container.appendChild(button1);
        container.appendChild(button2);
    });
}

const board1 = document.getElementById("player1-board");
const board2 = document.getElementById("player2-board");
function updateBoard(player){
    let referenceBoard = player.playerBoard.board;
    let domBoard;
    let boxes;

    if (turnText.textContent === "1"){
        domBoard = board1;
        boxes = document.querySelectorAll('.box');
        if (!board1.classList.contains('active')){
            board1.classList.add('active');
            board1.classList.remove('inactive');
        }
        if (!board2.classList.contains('inactive')){
            board2.classList.add('inactive');
            board2.classList.remove('active');
        }
    } else if (turnText.textContent === "2"){
        domBoard = board2;
        boxes = document.querySelectorAll('.box2');
        if (!board2.classList.contains('active')){
            board2.classList.add('active');
            board2.classList.remove('inactive');
        }
        if (!board1.classList.contains('inactive')){
            board1.classList.add('inactive');
            board1.classList.remove('active');
        }
    }

    for (let i = 0; i < referenceBoard.length; i++){
        for (let j = 0; j < referenceBoard[0].length; j++){
            const currentBox = Array.from(boxes).find(div =>
                div.dataset.x === i.toString() && div.dataset.y === j.toString()
            )
            const cell = referenceBoard[i][j];
            if (cell && cell.hit === true) {
                currentBox.textContent = "x";
                currentBox.style.color = 'red';
            } else if (cell && cell.miss === true) {
                currentBox.textContent = "o";
                currentBox.style.color = 'green';
            }
        }
        

    }


}



/* MASTER FUNCTION */
async function playBattleship() {
    const { player1, player2 } = setUp();
    let currentPlayer = player1;
    let opponent = player2;

    displayInstructions("Player 1: Place your ships");
    updateBoard(player1);
    await placeShips(player1, 'box');
    console.log(player1.playerShips);

    toggleTurn();

    displayInstructions("Player 2: Place your ships");
    updateBoard(player2);
    await placeShips(player2, 'box2');
    console.log(player2.playerShips);

    toggleTurn();

    displayInstructions("Game Start! Player 1 goes first.");
    updateBoard(opponent);

    let gameOver = false;

    async function handleTurn(event) {
        const box = event.target;
        if (!box.classList.contains('box') && !box.classList.contains('box2')) return;
    
        const x = parseInt(box.getAttribute("data-x"));
        const y = parseInt(box.getAttribute("data-y"));
    
        const opponentBoard = opponent.playerBoard;
        const cell = opponentBoard.board[x][y];
    
        if (cell?.hit || cell?.miss) return; // Already attacked
    
        opponentBoard.receiveAttack(x, y);
        updateBoard(opponent);
    
        if (opponentBoard.allShipsSunk()) {
            displayInstructions(`Player ${turnText.textContent} wins!`);
            gameOver = true;
            document.querySelectorAll('.box, .box2').forEach(box => {
                box.removeEventListener('click', handleTurn);
            });
            return;
        }
    
        if (opponentBoard.board[x][y].hit) {
            displayInstructions("Hit! Go again.");
            updateBoard(opponent)
        } else {
            displayInstructions("Miss! Switching turns...");
            // wait 5 seconds before switching turn and updating board
            await new Promise(resolve => setTimeout(resolve, 5000));
            toggleTurn();
            [currentPlayer, opponent] = [opponent, currentPlayer];
            updateBoard(opponent);
        }
    }
    

    const boxes = document.querySelectorAll('.box, .box2');
    boxes.forEach(box => box.addEventListener('click', handleTurn));
}

playBattleship();