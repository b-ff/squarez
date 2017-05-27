'use strict';

class Square {
    /**
     * Creates new square instance
     * @param size {Number} - size of square in pixels
     * @param minSize {Number} - minimal size of square in pixels
     * @param x {Number} — position in pixels from left
     * @param y {Number} — position in pixels from top
     * @param container {*} - parent DOM element square should be placed
     * @param direction {Object} - object containing direction data
     * @param direction.name {String} - (optional) Direction name in association with geographic directions
     * @param direction.x {Number} - Modifier for X coordinate specific for this direction (-1|0|1)
     * @param direction.y {Number} - Modifier for Y coordinate specific for this direction (-1|0|1)
     * @param multiplier {Number} - (optional) multiplier for default square speed
     */
    constructor(size, minSize, x, y, container, direction, multiplier = 1) {
        console.log('CREATE SQUARE >', `size: ${size}, at coords: ${x}, ${y}`);

        if (!window.SQUARES_COUNT) {
            window.SQUARES_COUNT = 1;
        } else {
            window.SQUARES_COUNT++;
        }

        this.size = size;
        this.minSize = minSize;

        this.callbacks = {};

        this.container = container;

        this.coords = { x, y };

        this.newOne = true;

        this.directions = [
            { name: 'N', x: 0, y: -1 },
            { name: 'NE', x: 1, y: -1 },
            { name: 'E', x: 1, y: 0 },
            { name: 'SE', x: 1, y: 1 },
            { name: 'S', x: 0, y: 1 },
            { name: 'SW', x: -1, y: 1 },
            { name: 'W', x: -1, y: 0 },
            { name: 'NW', x: -1, y: -1 }
        ];

        this.direction = (direction) ? direction : this.directions[(this.directions.length - 1) - Math.round(Math.random() * (this.directions.length - 1))];

        this.multiplier = multiplier;

        this.directionChanged = false;

        this.isDestroyed = false;

        this.DOMElement = document.createElement('div');

        this.DOMElement.style.left = this.coords.x + 'px';
        this.DOMElement.style.top = this.coords.y + 'px';
        this.DOMElement.style.width = size + 'px';
        this.DOMElement.style.height = size + 'px';
        this.DOMElement.id = `square_${window.SQUARES_COUNT}`;
        // this.DOMElement.innerText = `#${window.SQUARES_COUNT}`;
        this.DOMElement.className = [
            'square'
        ].join(' ');

        this.container.appendChild(this.DOMElement);
    }

    /**
     * Moves current square
     * @param speed {Number} - number of pixels to move in each direction
     * @param squares {Array} - array of other squares
     */
    move(speed, squares) {
        let collisionWith = this.checkForCollisions(squares);
        if (!this.newOne && collisionWith) {
            this.divide(collisionWith);
        }

        const top = this.coords.y;
        const left = this.coords.x;
        const right = document.body.clientWidth - left - this.size;
        const bottom = document.body.clientHeight - top - this.size;
        const squareSpeed = Math.round(speed * this.multiplier);

        if ((top === 0 || bottom === 0 || left === 0 || right === 0) && !this.directionChanged && !this.newOne) {
            this.changeDirection(top, bottom, left, right);
            return;
        }

        if (this.directionChanged) this.directionChanged = false;

        let x = left;
        let y = top;

        if (this.direction.x > 0) {
            x += (right - squareSpeed > 0) ? squareSpeed : right;
        }

        if (this.direction.x < 0) {
            x -= (left - squareSpeed > 0) ? squareSpeed : left;
        }

        if (this.direction.y > 0) {
            y += (bottom - squareSpeed > 0) ? squareSpeed : bottom;
        }

        if (this.direction.y < 0) {
            y -= (top - squareSpeed > 0) ? squareSpeed : top;
        }

        this.DOMElement.style.left = x + 'px';
        this.DOMElement.style.top = y + 'px';
        this.coords = { x, y };
        this.newOne = false;
    }

    /**
     * Changes direction depending on where is no more free space in relation to current square
     * @param top {Number} — free pixels count from top
     * @param bottom {Number} — free pixels count from bottom
     * @param left {Number} — free pixels count from left
     * @param right {Number} — free pixels count from right
     */
    changeDirection(top, bottom, left, right) { // kinda noob magic here
        if (top === 0 || bottom === 0) {
            this.direction.y = (~this.direction.y)+1;

            // This is implementation of movements exactly as it described in task...
            // However... It sucks! It's not a scientific and doesn't seems like real physics
            this.direction.x = (this.direction.x) ? 0 : ((Math.random() >= 0.5) ? 1 : -1);
        }

        if (left === 0 || right === 0) {
            this.direction.x = (~this.direction.x)+1;

            // See previous comment \(-_-")/
            this.direction.y = (this.direction.y) ? 0 : ((Math.random() >= 0.5) ? 1 : -1);
        }

        this.directionChanged = true;
    }

    /**
     * Complex check for collisions with other squares
     * @param squares {Array} - other squares on area
     * @returns {boolean} - is current square collided with some other square or not
     */
    checkForCollisions(squares) {
        const otherSquares = squares.filter((item) => {
            return this.DOMElement.id !== item.DOMElement.id;
        });

        const potentialCollidingSquares = this.preCheckCollisions(otherSquares);

        this.DOMElement.style.backgroundColor = '';

        if (potentialCollidingSquares.length) {
            this.DOMElement.style.backgroundColor = 'yellow';
            let collisionsWith = this.detailedCollisionsCheck(potentialCollidingSquares);

            if (collisionsWith.length) {
                this.DOMElement.style.backgroundColor = 'red';
                return collisionsWith;
            }
        }

        return false;
    }

    /**
     * Pre-checks possible collisions with other squares
     *
     * Well, it doesn't bring performance enhancement to us, but allows to predict future collision
     * Might be removed...
     *
     * @param otherSquares {Array} - other squares in the area
     * @returns {Array} - other squares pretending to collide
     */
    preCheckCollisions(otherSquares) {
        const getExternalRadius = squareSize => squareSize / Math.sqrt(2);
        const getSquareCenterCoords = square => {
            return {
                x: square.coords.x + (square.size / 2),
                y: square.coords.y + (square.size / 2)
            };
        };

        const currentSquareRadius = getExternalRadius(this.size);
        const currentSquareCenter = getSquareCenterCoords(this);

        return otherSquares.filter((square) => {
            const itemRadius = getExternalRadius(square.size);
            const itemCenter = getSquareCenterCoords(square);

            const minVectorLength = currentSquareRadius + itemRadius;
            const vectorCoords = {
                x: currentSquareCenter.x - itemCenter.x,
                y: currentSquareCenter.y - itemCenter.y
            };

            const vectorLength = Math.sqrt(Math.pow(vectorCoords.x, 2) + Math.pow(vectorCoords.y, 2));

            return vectorLength <= minVectorLength;
        });
    }

    /**
     * Checks if some of squares are collided with current square
     * @param potentialCollidingSquares {Array} - squares needed to be checked for collision
     * @returns {Array} - squares which are colliding with current square at this moment
     */
    detailedCollisionsCheck(potentialCollidingSquares) {
        return potentialCollidingSquares.filter((square) => {
            return Math.abs(square.coords.x - this.coords.x) <= this.size &&
                   Math.abs(square.coords.y - this.coords.y) <= this.size;
        });
    }

    addCallback(eventName, fn) {
        if (!this.callbacks[eventName]) this.callbacks[eventName] = [];
        this.callbacks[eventName].push(fn);
    }

    getEventCallbacks(eventName) {
        return this.callbacks[eventName] ? this.callbacks[eventName] : [];
    }

    /**
     * Adds callback on square destroy event
     * @param fn
     */
    onDestroy(fn) {
        this.addCallback('destroy', fn);
    }

    /**
     * Destroys current square
     */
    destroy() {
        this.getEventCallbacks('destroy').forEach(callback => callback(this));
        this.DOMElement.remove();
        this.isDestroyed = true;
        console.log('SQUARE DESTROYED >', this);
    }

    /**
     * Adds callback on square divide event
     * @param fn
     */
    onDivide(fn) {
        this.addCallback('divide', fn);
    }

    divide(collidedSquares) {
        if (this.isDestroyed) return;

        this.destroy();

        collidedSquares.forEach((square) => {
            square.divide([this]);
        });

        let size = Math.floor(this.size / 2);

        if (size <= this.minSize) return;

        let offset = Math.ceil(this.size / 2);

        let multiplier = this.multiplier + 0.5;

        // Let's add more anti-science chaos in this algorithm
        let direction = [
            (Math.random() >= 0.5) ? { name: 'N', x: 0, y: -1 } : { name: 'NW', x: -1, y: -1 },
            (Math.random() >= 0.5) ? { name: 'E', x: 1, y: 0 } : { name: 'NE', x: 1, y: -1 },
            (Math.random() >= 0.5) ? { name: 'W', x: -1, y: 0 } : { name: 'SW', x: -1, y: 1 },
            (Math.random() >= 0.5) ? { name: 'S', x: 0, y: 1 } : { name: 'SE', x: 1, y: 1 },
        ];

        let newSquares = [
            new Square(size, this.minSize, this.coords.x, this.coords.y, this.container, direction[0], multiplier),
            new Square(size, this.minSize, this.coords.x + offset, this.coords.y, this.container, direction[1], multiplier),
            new Square(size, this.minSize, this.coords.x, this.coords.y + offset, this.container, direction[2], multiplier),
            new Square(size, this.minSize, this.coords.x + offset, this.coords.y + offset, this.container, direction[3], multiplier),
        ];

        this.getEventCallbacks('divide').forEach(callback => callback(newSquares));

        console.log('SQUARE DIVIDED!');
    }
}

export default Square;