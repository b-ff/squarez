import 'babel-polyfill';
import '../styles/index.scss';
import Square from './squares';

'use strict';

if (module.hot) {
    module.hot.accept();
}

(() => {
    document.getElementById('count').focus();

    const speed = 1;
    const container = document.getElementById('game_area');
    const h1 = document.getElementsByTagName('h1')[0];

    let requestId;
    let isGameRunning = false;
    let squares = [];

    let initialSquaresCount;
    let initialSquaresSize;
    let minimumSquaresSize;

    let dividedSquaresCount;
    let removedSquaresCount;

    let divideSoundTimeout;

    const updateLiveSquaresCount = v => document.getElementById('stat_live_squares').querySelector('.stat__value').innerHTML = v;
    const updateRemovedSquaresCount = v => document.getElementById('stat_removed_squares').querySelector('.stat__value').innerHTML = v;
    const updateDividedSquaresCount = v => document.getElementById('stat_divided_squares').querySelector('.stat__value').innerHTML = v;

    const getRandom = (max) => {
        return max - Math.round((Math.random() * max));
    };

    const initSquare = (square) => {
        square.onDestroy((square) => {
            if (divideSoundTimeout) clearTimeout(divideSoundTimeout);
            let squareIdx = -1;

            squares.forEach((item, idx) => {
                if (item.DOMElement.id === square.DOMElement.id) squareIdx = idx;
            });

            if (squareIdx >= 0 ) squares.splice(squareIdx, 1);

            divideSoundTimeout = setTimeout(() => {
                const coinAudio = new Audio('./audio/coin.mp3');
                coinAudio.load();
                coinAudio.play();
            }, 50);

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

    const gameStart = () => {
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
            // @TODO add correct placing algorithm avoiding overlaps
            const x = getRandom(container.clientWidth - initialSquaresSize);
            const y = getRandom(container.clientHeight - initialSquaresSize);

            const square = new Square(initialSquaresSize, minimumSquaresSize, x, y, container, false, 10 * Math.random());

            initSquare(square);
        }

        const moves = () => {
            squares.forEach((square) => {
                square.move(speed, squares);
            });

            if (squares.length > 1 && isGameRunning) {
                requestId = requestAnimationFrame(moves);
            } else {
                if (squares.length === 1) {
                    h1.innerHTML = `#${squares[0].DOMElement.id} win!`;

                    const winAudio = new Audio('./audio/win.mp3');
                    winAudio.load();
                    winAudio.play();
                } else {
                    h1.innerHTML = 'What have you done?! They all died!';

                    const gameOverAudio = new Audio('./audio/game_over.mp3');
                    gameOverAudio.load();
                    gameOverAudio.play();
                }

                h1.style.display = '';
                document.getElementById('game_form').style.display = '';
                isGameRunning = false;
                console.log('GAME STOPPED!');
            }
        };

        requestId = requestAnimationFrame(moves);
    };

    const startGameByEnterHit = (e) => { if (e.keyCode === 13) gameStart(); };

    // Start button click handler
    document.getElementById('start_game').addEventListener('click', gameStart);

    // Start game by hitting Enter key in any form field
    document.getElementById('count').addEventListener('keydown', startGameByEnterHit);
    document.getElementById('size').addEventListener('keydown', startGameByEnterHit);
    document.getElementById('min_size').addEventListener('keydown', startGameByEnterHit);

    // Add new squares by clicking on game area
    container.addEventListener('click', (e) => {
        const offset = Math.round(initialSquaresSize / 2);
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

