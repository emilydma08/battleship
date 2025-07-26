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
            const boxes = document.querySelectorAll(`.${boxId}`);
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
                boxes.forEach(box => box.addEventListener('click', onClick));
            });

            const direction = await displayDirectionButtons();

            startBox.boxElement.textContent = "";

            try {
                board.placeShip(ships[i], startBox.x, startBox.y, direction);
                placed = true;

                // Visually mark the ship's position
                ships[i].positions.forEach(pos => {
                    const [x, y] = pos;
                    const shipBox = Array.from(boxes).find(box =>
                        box.dataset.x === x.toString() && box.dataset.y === y.toString()
                    );
                    if (shipBox) {
                        shipBox.textContent = 'X';
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 3000));

                // Clear the visual markers for the next placement
                ships[i].positions.forEach(pos => {
                    const [x, y] = pos;
                    const shipBox = Array.from(boxes).find(box =>
                        box.dataset.x === x.toString() && box.dataset.y === y.toString()
                    );
                    if (shipBox) {
                        shipBox.textContent = '';
                    }
                });

            } catch (e) {
                displayInstructions("Invalid placement, try again.");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}




/* DOM FUNCTIONS */
const turnText = document.getElementById("playerId");
function toggleTurn(){
    turnText.textContent = turnText.textContent === "1" ? "2" : "1";
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
function updateBoard(player, isOpponentBoard = false) {
    const referenceBoard = player.playerBoard.board;
    const boardId = isOpponentBoard ? (player === player1 ? 'player2-board' : 'player1-board') : (player === player1 ? 'player1-board' : 'player2-board');
    const boxClass = isOpponentBoard ? (player === player1 ? 'box2' : 'box') : (player === player1 ? 'box' : 'box2');
    const domBoard = document.getElementById(boardId);
    const boxes = document.querySelectorAll(`.${boxClass}`);

    // Simplified board state toggling
    if (isOpponentBoard) {
        board1.classList.toggle('active', player !== player1);
        board1.classList.toggle('inactive', player === player1);
        board2.classList.toggle('active', player === player1);
        board2.classList.toggle('inactive', player !== player1);
    }

    for (let i = 0; i < referenceBoard.length; i++) {
        for (let j = 0; j < referenceBoard[0].length; j++) {
            const currentBox = Array.from(boxes).find(div =>
                div.dataset.x === i.toString() && div.dataset.y === j.toString()
            );
            if (!currentBox) continue;

            const cell = referenceBoard[i][j];
            if (cell && cell.hit === true) {
                currentBox.textContent = "o";
                currentBox.style.color = 'green';
            } else if (cell && cell.miss === true) {
                currentBox.textContent = "x";
                currentBox.style.color = 'red';
            }
        }
    }
}



/* MASTER FUNCTION */
let player1, player2;
async function playBattleship() {
    const players = setUp();
    player1 = players.player1;
    player2 = players.player2;
    let currentPlayer = player1;
    let opponent = player2;

    displayInstructions("Player 1: Place your ships");
    updateBoard(player1);
    await placeShips(player1, 'box');

    toggleTurn();

    displayInstructions("Player 2: Place your ships");
    updateBoard(player2);
    await placeShips(player2, 'box2');

    toggleTurn();

    displayInstructions("Game Start! Player 1 goes first.");
    updateBoard(opponent);

    let gameOver = false;

    const continueBtn = document.getElementById('continue-btn');

    function showContinueButton() {
        continueBtn.style.display = 'block';
    }

    function hideContinueButton() {
        continueBtn.style.display = 'none';
    }

    continueBtn.addEventListener('click', () => {
        toggleTurn();
        [currentPlayer, opponent] = [opponent, currentPlayer];
        updateBoard(opponent, true);
        hideContinueButton();
        // Re-enable clicking on the board
        document.querySelectorAll('.box, .box2').forEach(box => {
            box.style.pointerEvents = 'auto';
        });
    });

    async function handleTurn(event) {
        if (gameOver) return;
        const box = event.target;
        if (!box.classList.contains('box') && !box.classList.contains('box2')) return;
    
        const x = parseInt(box.getAttribute("data-x"));
        const y = parseInt(box.getAttribute("data-y"));
    
        const opponentBoard = opponent.playerBoard;
        const cell = opponentBoard.board[x][y];
    
        if (cell?.hit || cell?.miss) return;
    
        opponentBoard.receiveAttack(x, y);
        updateBoard(opponent, true);
    
        const attackedCell = opponentBoard.board[x][y];
        if (attackedCell.hit) {
            const ship = attackedCell.ship;
            if (ship.isSunk()) {
                displayInstructions("You sunk a ship!");
            } else {
                displayInstructions("Hit! Go again.");
            }
        } else {
            displayInstructions("Miss! Switching turns...");
            showContinueButton();
            // Disable clicking on the board until continue is clicked
            document.querySelectorAll('.box, .box2').forEach(box => {
                box.style.pointerEvents = 'none';
            });
        }
    
        if (opponentBoard.allShipsSunk()) {
            displayInstructions(`Player ${turnText.textContent} wins!`);
            gameOver = true;
            hideContinueButton();
        }
    }
    

    const boxes = document.querySelectorAll('.box, .box2');
    boxes.forEach(box => box.addEventListener('click', handleTurn));
}

playBattleship();