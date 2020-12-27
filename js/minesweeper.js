const board = document.querySelector('#board');
const fakeWindow = document.querySelector('#window');
const stat = document.querySelector('#condition');
const title = document.querySelector('#title');
const gameWrap = document.querySelector('#game');
const menu_game = document.querySelector('.menu_game');
const menu_help = document.querySelector('.menu_help');
const remain = document.querySelector('#remain');
const face = document.querySelector('#face');
const time = document.querySelector('#time');
const newgame = document.querySelector('#beginner');
const beginner = document.querySelector('#beginner');
const intermediate = document.querySelector('#intermediate');
const expert = document.querySelector('#expert');
const sound_tick = new Audio('sounds/tick.mp3');
const sound_bomb = new Audio('sounds/bomb.mp3');
const sound_win = new Audio('sounds/win.mp3');
let mineCount = localStorage.getItem('mineCount') || 10;
let level = localStorage.getItem('level') || 'beginner';
let sound = localStorage.getItem('sound') || 'off';
let table = [];
const min_width = 9;
const min_height = 9;
const max_width = 30;
const max_height = 16;


let numbers = [
    []
];
let face_default, face_died, face_click_cell, face_click, face_clear;
let gameState = 'play';

const preload = _ => {
    for (let i = 0; i < 10; i++) {
        numbers[i] = new Image();
        numbers[i].src = 'images/' + i + '.png';
    }
    numbers[10] = new Image();
    numbers[10].src = 'images/-.png';

    for (let i = 1; i <= 8; i++) {
        let img = new Image();
        img.src = 'images/m_' + i + '.png'
    }

    face_default = new Image();
    face_default.src = 'images/face_default.png';

    face_click = new Image();
    face_click.src = 'images/face_click.png';

    face_died = new Image();
    face_died.src = 'images/face_died.png';

    face_click_cell = new Image();
    face_click_cell.src = 'images/face_click_cell.png';

    face_clear = new Image();
    face_clear.src = 'images/face_clear.png';
};

window.oncontextmenu = e => {
    e.preventDefault();
}
let boardArray = [];

const createTable = (width, height, mine) => {
    width = width < min_width ? min_width : width > max_width ? max_width : width;
    height = height < min_height ? min_height : height > max_height ? max_height : height;
    mineCount = mine;
    localStorage.setItem('mineCount', mineCount);
    localStorage.setItem('size', width + 'x' + height);
    table = [];
    let add = '';
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            table.push(0);
            add += `<div class='cell' data-position='${x},${y}'></div>`;
            if (x == width - 1) {
                add += `<div class='linebreak'></div>`
            }
        }
    }
    fakeWindow.style.width = width * 16 + 20 + 'px';
    fakeWindow.style.height = height * 16 + 108 + 'px';
    board.style.width = width * 16 + 'px';
    board.style.height = height * 16 + 'px';
    stat.style.width = width * 16 + 6 + 'px';
    gameWrap.style.width = width * 16 + 17 + 'px';
    gameWrap.style.height = height * 16 + 60 + 'px';

    board.innerHTML = add;
    clearInterval(timer);
    timer_time = 0;
    timer = null;
    gameState = 'play';
    setRemain(0);
    setTime(0);
    setFace(face_default);
    setBoard(mine);
    menu_game.style.display = 'none';
    menu_help.style.display = 'none';
    const levels = document.querySelectorAll('.level');
    for (let i = 0; i < levels.length; i++) {
        levels[i].classList.remove('checked');
    }
    level = localStorage.getItem('level') || 'beginner';
    document.querySelector(`#${level}`).classList.add('checked');
}
menu_help.parentNode.addEventListener('mouseover', e => {
    menu_help.style.display = 'block';
})
menu_help.parentNode.addEventListener('mouseout', e => {
    menu_help.style.display = 'none';
})

menu_game.parentNode.addEventListener('mouseover', e => {
    menu_game.style.display = 'block';
})
menu_game.parentNode.addEventListener('mouseout', e => {
    menu_game.style.display = 'none';
})

let mouseDown = false;
let clickedCell = null;
let startX, startY;
let faceCursor = false;
let tempFace = null;

let clickState = 0;
let clickTimer = null;

let leftDown = false;
let rightDown = false;

let arr3x3 = []
document.body.addEventListener('mousedown', e => {
    if (e.target == document.body) return;
    if (e.which == 1) {
        leftDown = true;
    } else if (e.which == 3) {
        rightDown = true;
    }

    startX = e.offsetX;
    startY = e.offsetY;
    mouseDown = true;
    if (gameState != 'play') {
        return;
    }
    if (e.target.className.indexOf('cell') != -1) {
        clickedCell = e.target;
        let posX = Number(clickedCell.dataset['position'].split(',')[0]);
        let posY = Number(clickedCell.dataset['position'].split(',')[1]);
        if (leftDown && !rightDown) {
            if (clickedCell.dataset['state'] != 'flag') {
                clickedCell.classList.add('empty');
            }
            setFace(face_click_cell);
        } else if (rightDown && !leftDown) {
            if (clickedCell.dataset['number'] != undefined) {
                return;
            }
            if (clickedCell.dataset['state'] == undefined) {
                clickedCell.dataset['state'] = 'flag';
            } else if (clickedCell.dataset['state'] == 'flag') {
                clickedCell.dataset['state'] = 'qm';
            } else {
                clickedCell.removeAttribute('data-state');
            }
            clickedCell = null;
            setRemain(mineCount - document.querySelectorAll('.cell[data-state="flag"]').length)
        } else if (leftDown && rightDown) {
            for(let x = -1; x <= 1; x++){
                for(let y = -1; y <= 1; y++){
                    if(x == 0 && y == 0){
                        continue;
                    }
                    let k = document.querySelector(`.cell[data-position='${(posX + x)},${(posY + y)}']`);
                    if (k != undefined && k.dataset['state'] != 'flag' && k.dataset['number'] == undefined) {
                        k.classList.add('empty');
                    }
                }
            }
        }
    }
})
let firstClick = false;
let timer_time = 0;
let timer = null;
document.body.addEventListener('mouseup', e => {
    if (gameState != 'play' || e.target == document.body || e.target.fakeWindow) {
        if (e.target == document.body) {
            setFace(face_default);
        }
        mouseDown = false;
        tempTarget = null;
        clickedCell = null;
        return;
    }

    if (faceCursor) {
        faceCursor = false;
        return;
    }
    if (gameState != 'play') return;
    if(leftDown && rightDown && clickedCell != undefined){
        let posX = Number(clickedCell.dataset['position'].split(',')[0]);
        let posY = Number(clickedCell.dataset['position'].split(',')[1]);
        let arr8 = [];
        let c = 8;
        for(let x = -1; x <= 1; x++){
            for(let y = -1; y <= 1; y++){
                if(x == 0 && y == 0){
                    continue;
                }
                let k = document.querySelector(`.cell[data-position='${(posX + x)},${(posY + y)}']`);
                if (k != undefined && k.dataset['state'] != 'flag') {
                    arr8.push(k);
                }else{
                    if(k == undefined){
                        c--;
                    }
                }
            }
        }
        let emptyCells = document.querySelectorAll('.cell.empty');
        for(let i = 0; i < emptyCells.length; i++){
            emptyCells[i].classList.remove('empty');
        }
        console.log(arr8)
        if(clickedCell.dataset['number'] != undefined && Number(clickedCell.dataset['number']) == c - arr8.length){
            for(let i = 0; i < arr8.length; i++){
                fill(Number(arr8[i].dataset['position'].split(',')[0]), Number(arr8[i].dataset['position'].split(',')[1]))
            }
        }
        

        leftDown = false;
        rightDown = false;
        clickedCell = null;
        tempTarget = null;
        mouseDown = false;
        return;
    }
    if (e.which == 1) {
        if (e.target.className.indexOf('cell') != -1) {
            if (firstClick == false) {
                while (true) {
                    if (getCell(Number(e.target.dataset['position'].split(',')[0]), Number(e.target.dataset['position'].split(',')[1])) != '0') {
                        createTable(localStorage.getItem('size').split('x')[0], localStorage.getItem('size').split('x')[1], mineCount);
                    } else {
                        break;
                    }
                }
                firstClick = true;
            }
            setFace(face_default)
            if (timer == null) {
                timer_time++;
                if (sound == 'on') {
                    sound_tick.play();
                }
                setTime(timer_time)
                timer = setInterval(function () {
                    timer_time++;
                    setTime(timer_time)
                }, 1000);
            }
            fill(Number(e.target.dataset['position'].split(',')[0]), Number(e.target.dataset['position'].split(',')[1]));
            const cells = document.querySelectorAll('.cell');
            let c = 0;
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].dataset['number'] != undefined) {
                    c++;
                }
            }
            if (c == cells.length - mineCount) {
                win();
            }
        }
        leftDown = false;
        clickedCell = null;
        tempTarget = null;
        mouseDown = false;
    }
    if (e.which == 3) {
        rightDown = false;
    }
})

const fill = (x, y) => {
    if (getCell(x, y) == undefined) {
        return;
    }
    const target = document.querySelector(`.cell[data-position='${x},${y}']`);
    if (target == null || target.dataset['number'] != undefined && target.dataset['number'] != '-1') {
        return;
    }
    if (target.dataset['state'] == 'flag') {
        return;
    }
    if (gameState != 'play') {
        return;
    }
    if (getCell(x, y) == '0') {
        target.removeAttribute('data-state');
        target.dataset['number'] = '0';
        fill(x - 1, y - 1);
        fill(x, y - 1);
        fill((x + 1), y - 1);

        fill(x - 1, y);
        fill((x + 1), y);

        fill(x - 1, (y + 1));
        fill(x, (y + 1));
        fill((x + 1), (y + 1));
    } else if (getCell(x, y) != 'm') {
        target.dataset['number'] = getCell(x, y);
    } else if (getCell(x, y) == 'm') {
        lose(x, y);
    }
}

const lose = (a, b) => {
    const width = Number(localStorage.getItem('size').split('x')[0]);
    const height = Number(localStorage.getItem('size').split('x')[0]);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (document.querySelector(`.cell[data-position='${x},${y}']`) == null) {
                continue;
            }
            if (document.querySelector(`.cell[data-position='${x},${y}']`).dataset['state'] == 'flag' && getCell(x, y) != 'm') {
                document.querySelector(`.cell[data-position='${x},${y}']`).dataset['number'] = 'm_flaged';
            } else if (getCell(x, y) == 'm' && document.querySelector(`.cell[data-position='${x},${y}']`).dataset['state'] != 'flag') {
                document.querySelector(`.cell[data-position='${x},${y}']`).dataset['number'] = 'm';
            }
        }
    }
    document.querySelector(`.cell[data-position='${a},${b}']`).dataset['number'] = 'm_clicked';
    clearInterval(timer);
    timer_time = 0;
    timer = null;
    setFace(face_died)
    gameState = 'died';
    leftDown = false;
    rightDown = false;
    if (sound == 'on') {
        sound_bomb.play();
    }
}

const win = _ => {
    if (gameState == 'died') {
        return;
    }
    setFace(face_clear);
    setRemain(0);
    const width = Number(localStorage.getItem('size').split('x')[0]);
    const height = Number(localStorage.getItem('size').split('x')[0]);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (document.querySelector(`.cell[data-position='${x},${y}']`) == null) {
                continue;
            }
            if (getCell(x, y) == 'm') {
                document.querySelector(`.cell[data-position='${x},${y}']`).dataset['state'] = 'flag';
            }
        }
    }        
    leftDown = false;
    rightDown = false;
    gameState = 'win';
    if (sound == 'on') {
        sound_win.play();
    }
}

tempTarget = null;
window.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    if (tempTarget != null) {
        fakeWindow.style.left = (e.clientX - startX + 'px');
        fakeWindow.style.top = (e.clientY - startY + 'px');
    }
    if (e.target == title) {
        tempTarget = e.target;
    }
    if (gameState != 'play') {
        return;
    }
    if(leftDown && rightDown){
        /*
        let posX = Number(clickedCell.dataset['position'].split(',')[0]);
        let posY = Number(clickedCell.dataset['position'].split(',')[1]);
        for(let x = -1; x <= 1; x++){
            for(let y = -1; y <= 1; y++){
                if(x == 0 && y == 0){
                    continue;
                }
                let k = document.querySelector(`.cell[data-position='${(posX + x)},${(posY + y)}']`);
                if (k != undefined && k.dataset['state'] != 'flag') {
                    k.classList.add('empty');
                }
            }
        }
        let emptyCells = document.querySelectorAll('.cell.empty');
        for(let i = 0; i < emptyCells.length; i++){
            emptyCells[i].classList.remove('empty');
        }
        */
    }


    if (e.target.className.indexOf('cell') != -1 && e.which == 1) {
        if (e.target == clickedCell && e.target.dataset['state'] != 'flag') {
            e.target.classList.add('empty');
        } else {
            if (clickedCell != null) {
                clickedCell.classList.remove('empty');
                clickedCell = e.target;
            }
        }
    } else {
        if (clickedCell != null) {
            clickedCell.classList.remove('empty');
        }
    }
})

face.addEventListener('mousedown', e => {
    if (e.which == 3) return;
    faceCursor = true;
    tempFace = face.innerHTML;
    face.innerHTML = `<img src=${face_click.src}>`;
})
face.addEventListener('mousemove', e => {
    if (e.which == 3) return;
    if (!faceCursor) return;
    face.innerHTML = `<img src=${face_click.src}>`;
})
face.addEventListener('mouseleave', e => {
    if (e.which == 3) return;
    if (!faceCursor) return;
    face.innerHTML = tempFace;
})
face.addEventListener('mouseup', e => {
    if (e.which == 3) return;
    faceCursor = false;
    newGame();
    setFace(face_default);
})

const setRemain = num => {
    setNumber(remain, num);
}
const setTime = num => {
    if (gameState != 'play') return;
    if (num > 0) {
        if (sound == 'on') {
            sound_tick.play();
        }
    }
    setNumber(time, num);
}
const setFace = face_ => {
    if (gameState == 'play') {
        face.innerHTML = `<img src=${face_.src}>`;
    }
}

const setNumber = (parent, num) => {
    if (num > 999) {
        num = 999;
    }
    if (num < -99) {
        num = -99;
    }
    parent.innerHTML = '';
    num = num + "";
    if (num.toString().length == 2) {
        if (num < 0) {
            num = "-0" + Math.abs(num);
        } else {
            num = "0" + num;
        }
    }
    if (num.toString().length == 1) {
        if (num < 0) {
            num = "-" + Math.abs(num);
        } else {
            num = "00" + num;
        }
    }

    const add = `<img src=${numbers[num[0] >= 0 ? num[0] : 10].src}><img src=${numbers[num[1]].src}><img src='${numbers[num[2]].src}'>`;
    parent.innerHTML = add;
}

const newGame = _ => {
    firstClick = false;
    leftDown = false;
    rightDown = false;
    mouseDown = false;
    createTable(localStorage.getItem('size').split('x')[0], localStorage.getItem('size').split('x')[1], mineCount);
}

window.addEventListener('keydown', e => {
    if (e.key == 'F2') {
        newGame();
    }
})

const getCell = (x, y) => {
    if (x < 0 || y < 0) return undefined;
    if (table[y] == undefined || table[y][x] == undefined) return undefined;
    return table[y][x];
}
const setCell = (x, y, value) => {
    if (table[y] == undefined) return;
    table[y][x] = value;
}

const switchSound = _ => {
    sound = sound == 'on' ? 'off' : 'on';
    const cl = document.querySelector('#sound').classList;
    sound == 'on' ? cl.add('checked') : cl.remove('checked');
    menu_game.style.display = 'none';
    localStorage.setItem('sound', sound);
}

const setBoard = (mineCount) => {
    const width = Number(localStorage.getItem('size').split('x')[0]);
    const height = Number(localStorage.getItem('size').split('x')[0]);
    const maxMine = (width - 1) * (height - 1);
    mineCount = mineCount < maxMine ? mineCount : maxMine;
    localStorage.setItem('mineCount', mineCount);
    setRemain(mineCount);
    setTime(0);
    for (let i = 0; i < mineCount; i++) {
        table[i] = 'm';
    }
    let ln = 0;
    table.sort(_ => [0.5 - Math.random()]);
    table.sort(_ => [0.5 - Math.random()]);
    table.sort(_ => [0.5 - Math.random()]);
    const tempTable = table;
    table = [];
    for (let y = 0; y < height; y++) {
        table[y] = [];
        for (let x = 0; x < width; x++) {
            table[y].push(tempTable[ln] + '');
            ln++;
        }
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let n = 0;
            if (getCell(x, y) == 'm') {
                continue;
            }
            if (getCell(x - 1, y - 1) == 'm') n++;
            if (getCell(x, y - 1) == 'm') n++;
            if (getCell(x + 1, y - 1) == 'm') n++;

            if (getCell(x - 1, y) == 'm') n++;
            if (getCell(x + 1, y) == 'm') n++;

            if (getCell(x - 1, y + 1) == 'm') n++;
            if (getCell(x, y + 1) == 'm') n++;
            if (getCell(x + 1, y + 1) == 'm') n++;
            setCell(x, y, n + '');
        }
    }
}


window.onload = e => {
    preload();
    if (localStorage.getItem('size') == undefined) {
        localStorage.setItem('size', '9x9');
    }
    document.querySelector(`#${level}`).classList.add('checked');
    if (sound == 'on') {
        document.querySelector('#sound').classList.add('checked');
    }
    createTable(localStorage.getItem('size').split('x')[0], localStorage.getItem('size').split('x')[1], mineCount);
}