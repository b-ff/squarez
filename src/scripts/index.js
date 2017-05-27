import 'babel-polyfill';
import '../styles/index.scss';
import Square from './squares';

'use strict';

if (module.hot) {
    module.hot.accept();
}

(() => {
    let speed = 1;
    let showCycleTime = false;

    let requestId;
    let container = document.getElementById('game_area');
    let isGameRunning = false;
    let squares = [];
    let h1 = document.getElementsByTagName('h1')[0];

    let initialSquaresCount;
    let initialSquaresSize;
    let minimumSquaresSize;

    let dividedSquaresCount;
    let removedSquaresCount;

    let getRandom = (max) => {
        return max - Math.round((Math.random() * max));
    };

    let updateLiveSquaresCount = value => document.getElementById('stat_live_squares').querySelector('.stat__value').innerHTML = value;
    let updateRemovedSquaresCount = value => document.getElementById('stat_removed_squares').querySelector('.stat__value').innerHTML = value;
    let updateDividedSquaresCount = value => document.getElementById('stat_divided_squares').querySelector('.stat__value').innerHTML = value;

    let initSquare = (square) => {
        square.onDestroy((square) => {
            let squareIdx = -1;

            squares.forEach((item, idx) => {
                if (item.DOMElement.id === square.DOMElement.id) squareIdx = idx;
            });

            if (squareIdx >= 0 ) squares.splice(squareIdx, 1);

            updateRemovedSquaresCount(removedSquaresCount++);
            updateLiveSquaresCount(squares.length);
        });

        square.onDivide((newSquares) => {
            newSquares.forEach(s => initSquare(s));
            updateDividedSquaresCount(dividedSquaresCount++);
        });

        squares.push(square);

        updateLiveSquaresCount(squares.length);
    };

    let gameStart = () => {
        if (isGameRunning) return;
        isGameRunning = true;

        if (requestId) cancelAnimationFrame(requestId);

        dividedSquaresCount = 0;
        removedSquaresCount = 0;

        squares = [];
        container.innerHTML = '';

        initialSquaresCount = parseInt(document.getElementById('count').value);
        initialSquaresSize = parseInt(document.getElementById('size').value);
        minimumSquaresSize = parseInt(document.getElementById('min_size').value);

        if (
            (isNaN(initialSquaresCount) || isNaN(initialSquaresSize) || isNaN(minimumSquaresSize)) &&
            (minimumSquaresSize >= initialSquaresSize) &&
            !initialSquaresCount
        ) return;

        console.log('GAME STARTED!', {
            initialSquaresCount,
            initialSquaresSize,
            minimumSquaresSize
        });

        container.innerHTML = '';

        document.getElementById('game_form').style.display = 'none';
        h1.style.display = 'none';

        for (let i = 0; i < initialSquaresCount; i++) {
            let x = getRandom(container.clientWidth - initialSquaresSize);
            let y = getRandom(container.clientHeight - initialSquaresSize);

            const square = new Square(initialSquaresSize, minimumSquaresSize, x, y, container, false, 10 * Math.random());

            initSquare(square);
        }

        let time = Date.now();

        let moves = () => {
            squares.forEach((square) => {
                square.move(speed, squares);
            });

            if (showCycleTime) console.log('cycle time (ms):', Date.now() - time);

            time = Date.now();

            if (squares.length > 1 && isGameRunning) {
                requestId = requestAnimationFrame(moves);
            } else {
                h1.innerHTML =  (squares.length === 1) ? `#${squares[0].DOMElement.id} win!` : 'What have you done?! They all died!';
                h1.style.display = '';
                document.getElementById('game_form').style.display = '';
                isGameRunning = false;
                console.log('GAME STOPPED!');
            }
        };

        requestId = requestAnimationFrame(moves);
    };

    // Start button click handler
    document.getElementById('start_game').addEventListener('click', gameStart);

    let startGameByEnterHit = (e) => { if (e.keyCode === 13) gameStart(); };

    document.getElementById('count').addEventListener('keydown', startGameByEnterHit);
    document.getElementById('size').addEventListener('keydown', startGameByEnterHit);
    document.getElementById('min_size').addEventListener('keydown', startGameByEnterHit);

    container.addEventListener('click', (e) => {
        let offset = Math.round(initialSquaresSize / 2);
        let x;
        let y;

        if (e.x <= offset) {
            x = e.x;
        } else if (e.x >= container.clientWidth - offset) {
            x = e.x - initialSquaresSize;
        } else {
            x = e.x - offset;
        }

        if (e.y <= offset) {
            y = e.y;
        } else if (e.y >= container.clientHeight - offset) {
            y = e.y - initialSquaresSize;
        } else {
            y = e.y - offset;
        }

        if (isGameRunning) {
            initSquare(new Square(initialSquaresSize, minimumSquaresSize, x, y, container));
        }
    });
})();

