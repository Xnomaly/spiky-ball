const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ballRadius = 10;

let stickManX = canvas.width / 2;
let stickManY = canvas.height - 120; // Adjusted to spawn on the grass
const stickManSpeed = 5;

let lives = 3;
let gameOver = false;
let points = 0;

let balls = [{ x: canvas.width / 2, y: canvas.height / 2, dx: 2, dy: -2 }];

let keys = {};

const maxBalls = 5;
const maxSpeedIncrease = 4; // Adjusted max speed increase

let stickManFrame = 0;
let stickManFrameCounter = 0;
const stickManFrameInterval = 5; // Change frame every 5 ticks
const stickManFrames = [
    { // Frame 1
        arms: [-15, 0, 15, 0],
        legs: [-10, 20, 10, 20]
    },
    { // Frame 2
        arms: [-10, 10, 10, 10],
        legs: [-15, 25, 15, 25]
    },
    { // Frame 3
        arms: [15, 0, -15, 0],
        legs: [10, 20, -10, 20]
    }
];

const grassTop = canvas.height - 100;

let hasRocketBoots = false;
let hasTopHat = false;
let isHiding = false;
let hideTimeout;

let speechBubble = { text: "", x: 0, y: 0, visible: false, timeout: null };

let hideCooldown = 0;
const hideCooldownDuration = 10000; // 10 seconds

let invincible = false;
let invincibleTimeout;

const boxWidth = 100;
const boxHeight = 50;

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#000000"; // Black color
    ctx.fill();
    ctx.closePath();
}

function drawSpikes(ball) {
    const spikeCount = 8;
    const spikeLength = 15;
    const angleStep = (Math.PI * 2) / spikeCount;

    for (let i = 0; i < spikeCount; i++) {
        const angle = i * angleStep;
        const startX = ball.x + ballRadius * Math.cos(angle);
        const startY = ball.y + ballRadius * Math.sin(angle);
        const midX = ball.x + (ballRadius + spikeLength / 2) * Math.cos(angle + angleStep / 2);
        const midY = ball.y + (ballRadius + spikeLength / 2) * Math.sin(angle + angleStep / 2);
        const endX = ball.x + (ballRadius + spikeLength) * Math.cos(angle + angleStep);
        const endY = ball.y + (ballRadius + spikeLength) * Math.sin(angle + angleStep);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#808080"; // Gray color
        ctx.stroke();
        ctx.closePath();
    }
}

function drawBackground() {
    ctx.fillStyle = "#87CEEB"; // Sky blue color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#228B22"; // Forest green color
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100); // Land
}

function drawRocketBoots() {
    if (hasRocketBoots && stickManY < grassTop) {
        // Draw fire
        ctx.fillStyle = "#FF4500"; // Orange color
        ctx.beginPath();
        ctx.moveTo(stickManX - 5, stickManY + 40);
        ctx.lineTo(stickManX, stickManY + 60);
        ctx.lineTo(stickManX + 5, stickManY + 40);
        ctx.fill();
        ctx.closePath();
    }
}

function drawTopHat() {
    if (hasTopHat) {
        ctx.fillStyle = "#000000"; // Black color
        ctx.fillRect(stickManX - 15, stickManY - 40, 30, 10); // Hat brim
        ctx.fillRect(stickManX - 10, stickManY - 60, 20, 20); // Hat top
    }
}

function showSpeechBubble(text) {
    speechBubble.text = text;
    speechBubble.visible = true;
    if (speechBubble.timeout) {
        clearTimeout(speechBubble.timeout);
    }
    speechBubble.timeout = setTimeout(() => {
        speechBubble.visible = false;
    }, 5000); // Show for 5 seconds
}

function drawSpeechBubble() {
    if (speechBubble.visible) {
        const x = stickManX + 20;
        const y = stickManY - 60;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, 150, 50);
        ctx.strokeRect(x, y, 150, 50);
        ctx.fillStyle = "#000000";
        ctx.font = "14px Arial";
        ctx.fillText(speechBubble.text, x + 10, y + 25);
    }
}

function drawStickMan() {
    if (!isHiding) {
        if (invincible) {
            ctx.globalAlpha = 0.5; // Make stick man semi-transparent
        }

        ctx.strokeStyle = "#0000FF"; // Blue color
        ctx.lineWidth = 2;

        // Head
        ctx.beginPath();
        ctx.arc(stickManX, stickManY - 20, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#0000FF"; // Fill color for head
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Body
        ctx.beginPath();
        ctx.moveTo(stickManX, stickManY - 10);
        ctx.lineTo(stickManX, stickManY + 20);
        ctx.stroke();
        ctx.closePath();

        // Arms
        ctx.beginPath();
        ctx.moveTo(stickManX + stickManFrames[stickManFrame].arms[0], stickManY);
        ctx.lineTo(stickManX + stickManFrames[stickManFrame].arms[2], stickManY);
        ctx.stroke();
        ctx.closePath();

        // Legs
        ctx.beginPath();
        ctx.moveTo(stickManX, stickManY + 20);
        ctx.lineTo(stickManX + stickManFrames[stickManFrame].legs[0], stickManY + 40);
        ctx.moveTo(stickManX, stickManY + 20);
        ctx.lineTo(stickManX + stickManFrames[stickManFrame].legs[2], stickManY + 40);
        ctx.stroke();
        ctx.closePath();

        drawRocketBoots();

        ctx.globalAlpha = 1.0; // Reset transparency
    }

    drawTopHat();
}

function drawHeart(x, y, filled) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x, y - 3, x - 3, y - 9, x - 9, y - 9);
    ctx.bezierCurveTo(x - 21, y - 9, x - 21, y + 13.5, x - 21, y + 13.5);
    ctx.bezierCurveTo(x - 21, y + 24, x - 12, y + 37.2, x, y + 48);
    ctx.bezierCurveTo(x + 12, y + 37.2, x + 21, y + 24, x + 21, y + 13.5);
    ctx.bezierCurveTo(x + 21, y + 13.5, x + 21, y - 9, x + 9, y - 9);
    ctx.bezierCurveTo(x + 3, y - 9, x, y - 3, x, y);
    ctx.closePath();
    ctx.fillStyle = filled ? "#FF0000" : "#808080"; // Red if filled, gray if not
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.stroke();
}

function drawLives() {
    const heartX = canvas.width - 120;
    const heartY = 20;
    for (let i = 0; i < 3; i++) {
        drawHeart(heartX + i * 40, heartY, i < lives);
    }
}

function drawPoints() {
    ctx.font = "20px Arial"; // Increased font size
    ctx.fillStyle = "#000000"; // Black color
    ctx.fillText("Points: " + points, 8, 20);
}

function drawGameOver() {
    ctx.fillStyle = "#808080"; // Gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px Arial";
    ctx.fillStyle = "#FF0000"; // Red text
    ctx.fillText("Game Over", canvas.width / 2 - 150, canvas.height / 2 - 50);

    // Draw restart button
    ctx.fillStyle = "#000000"; // Black button
    ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2, 150, 50);
    ctx.fillStyle = "#FFFFFF"; // White text
    ctx.font = "24px Arial";
    ctx.fillText("Restart", canvas.width / 2 - 45, canvas.height / 2 + 35);

    // Add event listener for restart button
    canvas.addEventListener('click', handleRestartClick);
}

function handleRestartClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= canvas.width / 2 - 75 && x <= canvas.width / 2 + 75 && y >= canvas.height / 2 && y <= canvas.height / 2 + 50) {
        restartGame();
    }
}

function restartGame() {
    // Reset game variables
    stickManX = canvas.width / 2;
    stickManY = canvas.height - 120;
    lives = 3;
    gameOver = false;
    points = 0;
    balls = [{ x: canvas.width / 2, y: canvas.height / 2, dx: 2, dy: -2 }];
    hasRocketBoots = false;
    hasTopHat = false;
    isHiding = false;
    speechBubble = { text: "", x: 0, y: 0, visible: false, timeout: null };

    // Remove event listener for restart button
    canvas.removeEventListener('click', handleRestartClick);

    // Show initial speech bubble
    showSpeechBubble("Use W S A D to move");
}

function detectCollision(ball) {
    if (invincible) {
        return; // Do not detect collisions if invincible
    }

    const distX = Math.abs(ball.x - stickManX);
    const distY = Math.abs(ball.y - (stickManY - 10)); // Adjust for stick man's body

    if (distX < ballRadius + 10 && distY < ballRadius + 30) { // Adjust for stick man's body height
        lives--;
        if (lives <= 0) {
            gameOver = true;
        } else {
            // Reset ball position but keep the same speed
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.dx = speed * Math.cos(angle);
            ball.dy = speed * Math.sin(angle);
        }
    }
}

function moveStickMan() {
    if (isHiding) {
        return; // Do not move if hiding
    }

    if (hasRocketBoots) {
        if (keys['w'] && stickManY - stickManSpeed > 0) {
            stickManY -= stickManSpeed;
        }
        if (keys['s'] && stickManY + stickManSpeed < canvas.height) {
            stickManY += stickManSpeed;
        }
    } else {
        if (keys['w'] && stickManY - stickManSpeed > grassTop) {
            stickManY -= stickManSpeed;
        }
        if (keys['s'] && stickManY + stickManSpeed < canvas.height - 40) { // Adjust for stick man's height
            stickManY += stickManSpeed;
        }
    }
    if (keys['a'] && stickManX - stickManSpeed > 0) {
        stickManX -= stickManSpeed;
    }
    if (keys['d'] && stickManX + stickManSpeed < canvas.width) {
        stickManX += stickManSpeed;
    }

    // Update frame for running animation
    if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
        stickManFrameCounter++;
        if (stickManFrameCounter >= stickManFrameInterval) {
            stickManFrame = (stickManFrame + 1) % stickManFrames.length;
            stickManFrameCounter = 0;
        }
    }
}

function drawHatIcon() {
    const x = 20;
    const y = canvas.height - 60;
    ctx.fillStyle = "#000000"; // Black color
    ctx.fillRect(x, y, 30, 10); // Hat brim
    ctx.fillRect(x + 5, y - 20, 20, 20); // Hat top

    if (hideCooldown > 0) {
        const remainingTime = Math.ceil(hideCooldown / 1000);
        ctx.fillStyle = "#FFFFFF"; // White color for text
        ctx.font = "16px Arial";
        ctx.fillText(remainingTime, x + 10, y - 5);
    }
}

function hideInHat() {
    if (hasTopHat && !isHiding && hideCooldown === 0) {
        isHiding = true;
        hideTimeout = setTimeout(() => {
            isHiding = false;
            invincible = true;
            hideCooldown = hideCooldownDuration;
            invincibleTimeout = setTimeout(() => {
                invincible = false;
            }, 500); // Invincible for 0.5 seconds
        }, 250); // Hide for 0.25 seconds
    }
}

function updateCooldown() {
    if (hideCooldown > 0) {
        hideCooldown -= 10; // Decrease cooldown by 10ms (interval duration)
        if (hideCooldown < 0) {
            hideCooldown = 0;
        }
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') { // Space bar
        hideInHat();
    }
    // Removed 'q' key functionality
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function drawBox() {
    const x = (canvas.width - boxWidth) / 2;
    const y = 0;
    ctx.fillStyle = "#808080"; // Gray color
    ctx.fillRect(x, y, boxWidth, boxHeight);
}

function drawWinScreen() {
    ctx.fillStyle = "#808080"; // Gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px Arial";
    ctx.fillStyle = "#FFFF00"; // Yellow text
    ctx.fillText("You Win", canvas.width / 2 - 100, canvas.height / 2 - 50);

    // Draw restart button
    ctx.fillStyle = "#000000"; // Black button
    ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2, 150, 50);
    ctx.fillStyle = "#FFFFFF"; // White text
    ctx.font = "24px Arial";
    ctx.fillText("Restart", canvas.width / 2 - 45, canvas.height / 2 + 35);

    // Add event listener for restart button
    canvas.addEventListener('click', handleRestartClick);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBox();
    balls.forEach(ball => {
        drawBall(ball);
        drawSpikes(ball);
    });
    moveStickMan();
    drawStickMan();
    drawLives();
    drawPoints();
    drawSpeechBubble();
    drawHatIcon();
    balls.forEach(ball => detectCollision(ball));
    if (gameOver) {
        drawGameOver();
        return;
    }
    if (points >= 999) {
        drawWinScreen();
        return;
    }
    balls.forEach(ball => {
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
            points++;
        }
        if (ball.y + ball.dy > canvas.height - ballRadius || ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
            points++;
        }
        ball.x += ball.dx;
        ball.y += ball.dy;
    });

    if (points >= 15 && !hasRocketBoots) {
        hasRocketBoots = true;
        showSpeechBubble("You can fly now!");
    }

    if (points >= 35 && !hasTopHat) {
        hasTopHat = true;
        showSpeechBubble("Press space to hide");
    }

    if (points < 15 && !speechBubble.visible) {
        showSpeechBubble("Use W S A D to move");
    }

    if (points >= 60) {
        balls.forEach(ball => {
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.dx = 5 * Math.cos(angle);
            ball.dy = 5 * Math.sin(angle);
        });
    }

    if (points % 10 === 0 && points !== 0 && balls.length < maxBalls && balls.length < points / 10) {
        const firstBallSpeed = Math.sqrt(balls[0].dx * balls[0].dx + balls[0].dy * balls[0].dy);
        const angle = Math.atan2(balls[0].dy, balls[0].dx);
        balls.push({ x: canvas.width / 2, y: boxHeight / 2, dx: firstBallSpeed * Math.cos(angle), dy: firstBallSpeed * Math.sin(angle) });
    }

    if (points % 10 === 0 && points !== 0 && points < 60) {
        balls.forEach(ball => {
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const speedIncrease = Math.min(currentSpeed + 0.1, maxSpeedIncrease);
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.dx = speedIncrease * Math.cos(angle);
            ball.dy = speedIncrease * Math.sin(angle);
        });
    }

    updateCooldown();
}

setInterval(draw, 10);

// Show initial speech bubble
showSpeechBubble("Use W S A D to move");
