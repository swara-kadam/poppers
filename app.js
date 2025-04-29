// Define 7 vertical lanes (percentages of sky height)
const lanes = [10, 23, 36, 49, 62, 75, 88];
const occupiedLanes = [false, false, false, false, false, false, false];

// Store tasks
const tasks = [];

// constants
const DAYS_ON_TIMELINE = 7;
const FULL_WIDTH = 100; // %

const PERCENT_PER_DAY = FULL_WIDTH / DAYS_ON_TIMELINE; // ~14.28%
const PERCENT_PER_SECOND = PERCENT_PER_DAY / (24 * 60 * 60); // move 14.28% per day
const PERCENT_PER_TICK = PERCENT_PER_SECOND * (20/1000); // 20ms tick

function addTask() {
    const titleInput = document.getElementById("taskTitle");
    const dueDateInput = document.getElementById("taskDueDate");

    const title = titleInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!title || !dueDate) {
        alert("Please enter both task title and due date!");
        return;
    }

    let laneIndex = occupiedLanes.findIndex(lane => lane === false);
    if (laneIndex === -1) {
        alert("Max 7 tasks allowed at a time! Don't overbook yourself <3");
        return;
    }

    occupiedLanes[laneIndex] = true;

    const balloonImages = [
        'assets/images/balloon-pink.png',
        'assets/images/balloon-yellow.png',
        'assets/images/balloon-green.png'
    ];
    const overdueImage = 'assets/images/balloon-red.png';

    const dueDateObj = new Date(dueDate);
    const today = new Date();
    dueDateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = dueDateObj - today;
    const daysLeftRaw = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const maxDays = 7;
    const dayWidth = 100 / maxDays;
    let positionX = 0;
    let imageToUse;

    if (daysLeftRaw < 0) {
        alert("Task is already overdue! Adding to overdue zone.");
        positionX = 95;
        imageToUse = overdueImage;
    } else if (daysLeftRaw === 0) {
        positionX = 95;
        imageToUse = overdueImage;
    } else if (daysLeftRaw >= maxDays) {
        positionX = 0;
        imageToUse = balloonImages[Math.floor(Math.random() * balloonImages.length)];
    } else {
        positionX = (maxDays - daysLeftRaw) * dayWidth;
        imageToUse = balloonImages[Math.floor(Math.random() * balloonImages.length)];
    }

    // --- create <img> balloon ---
    const balloon = document.createElement("img");
    balloon.classList.add("balloon");
    balloon.src = imageToUse;
    balloon.dataset.title = title; // Save title for hover
    balloon.dataset.createdAt = new Date().toISOString();
    balloon.dataset.dueDate = dueDate;

    // Set animation
    balloon.style.transform = "scale(0.1)";
    balloon.style.animation = "inflate 2.0s ease-out forwards";

    setTimeout(() => {
        balloon.style.animation = "bob 3s ease-in-out infinite";
    }, 2000);

    // Set position
    balloon.style.top = lanes[laneIndex] + "%";
    balloon.style.left = positionX + "%";
    balloon.dataset.laneIndex = laneIndex;

    // Add to page
    document.getElementById("balloons").appendChild(balloon);
    playInflateSound();

    // Save to tasks array
    const task = {
        title: title,
        createdAt: new Date(),
        dueDate: dueDate,
        balloon: balloon
    };
    tasks.push(task);

    // Add events
    balloon.addEventListener('click', function() {
        popBalloon(this);
    });
    balloon.addEventListener('mousemove', (event) => {
        showTooltip(event, task);
        moveFakeCursor(event);
    });
    balloon.addEventListener('mouseleave', (event) => {
        hideTooltip();
        hideFakeCursor();
    });

    // Clear inputs
    titleInput.value = "";
    dueDateInput.value = "";

    moveBalloon(balloon);
}


function moveFakeCursor(event) {
    const cursor = document.getElementById('fakeCursor');
    cursor.style.display = 'block';
    cursor.style.left = event.pageX + 'px';
    cursor.style.top = event.pageY + 'px';
}

function hideFakeCursor() {
    const cursor = document.getElementById('fakeCursor');
    cursor.style.display = 'none';
}



function showTooltip(event, task) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'block';

    tooltip.innerHTML = `
        <strong>${task.title}</strong><br>
        Created: ${formatDate(task.createdAt)}<br>
        Due: ${formatDate(new Date(task.dueDate))}
    `;

    // Position tooltip near the cursor
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY + 15) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}


function popBalloon(balloon) {
    const laneIndex = parseInt(balloon.dataset.laneIndex);

    // Free the lane
    occupiedLanes[laneIndex] = false;

    // Find the corresponding task object
    const task = tasks.find(t => t.balloon === balloon);

    if (task) {
        // Save completed task with all details
        saveCompletedTask(task);
    }

    playPopSound();
    // Show confetti
    showConfetti(balloon);

    // Remove the balloon
    balloon.remove();
}

function playPopSound() {
    const popSound = new Audio('assets/sounds/pop.mp3');
    popSound.volume = 0.5; // Adjust volume if needed
    popSound.play();
}

function playInflateSound() {
    const popSound = new Audio('assets/sounds/inflate.mp3');
    popSound.volume = 0.5; // Adjust volume if needed
    popSound.play();
}





function showConfetti(balloon) {
    const sky = document.getElementById('sky');
    const balloonRect = balloon.getBoundingClientRect();
    const skyRect = sky.getBoundingClientRect();

    const centerX = balloonRect.left - skyRect.left + balloon.offsetWidth / 2;
    const centerY = balloonRect.top - skyRect.top + balloon.offsetHeight / 2;

    const colors = ["#FFD1DC", "#D1E8FF", "#C8F4C8", "#FFF1C1", "#E5D1FF", "#FFE5B4", "#FFB347", "#B0E0E6"];

    for (let i = 0; i < 20; i++) { // 20 pieces of confetti
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        // Random color
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = randomColor;

        // Random slight angle
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 80; // how far it flies

        const translateX = Math.cos(angle) * distance;
        const translateY = Math.sin(angle) * distance;

        confetti.style.left = centerX + "px";
        confetti.style.top = centerY + "px";

        confetti.style.setProperty('--translate-x', `${translateX}px`);
        confetti.style.setProperty('--translate-y', `${translateY}px`);

        sky.appendChild(confetti);

        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 1000);
    }
}



function openTab(tabName) {
    const tabs = document.getElementsByClassName("tab-content");
    const buttons = document.getElementsByClassName("tab-button");

    // Hide all tabs
    for (let tab of tabs) {
        tab.style.display = "none";
    }

    // Remove active class from all buttons
    for (let button of buttons) {
        button.classList.remove("active");
    }

    // Show the selected tab
    document.getElementById(tabName).style.display = "block";

    // Set active class on the clicked button
    event.currentTarget.classList.add("active");
}

function moveBalloon(balloon) {
    let currentLeft = parseFloat(balloon.style.left); // starting position
    const driftSpeed = PERCENT_PER_TICK; // very slow drift

    const intervalId = setInterval(() => {
        currentLeft += driftSpeed;
        balloon.style.left = currentLeft + "%";

        if (currentLeft >= 95) {
            clearInterval(intervalId);
            balloon.style.left = "95%"; // fix it at right edge
        }
    }, 20); // every 20 milliseconds
}

function createTimeline() {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = ""; // Clear any existing lines

    const days = 7;
    const timelineMaxWidth = 95; // only up to 95%, not full 100%
    
    for (let i = 0; i <= days; i++) {
        const line = document.createElement("div");
        line.classList.add("timeline-line");

        const label = document.createElement("div");
        label.classList.add("timeline-label");

        // Positioning
        const leftPercent = (i / days) * timelineMaxWidth;
        line.style.left = leftPercent + "%";
        label.style.left = leftPercent + "%";

        // Label Text
        if (i === days) {
            label.innerText = "Overdue";
        } else {
            label.innerText = `Due in ${days - i} days`;
        }

        timeline.appendChild(line);
        timeline.appendChild(label);
    }
}


function saveCompletedTask(task) {
    const table = document.getElementById("completedTasksTable").getElementsByTagName('tbody')[0];

    const newRow = table.insertRow();
    const titleCell = newRow.insertCell(0);
    const createdCell = newRow.insertCell(1);
    const dueCell = newRow.insertCell(2);
    const completedCell = newRow.insertCell(3);

    const now = new Date();

    titleCell.innerText = task.title;
    createdCell.innerText = formatDate(task.createdAt); 
    dueCell.innerText = formatDate(new Date(task.dueDate));
    completedCell.innerText = formatDate(now);
}

function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString(); 
}




// Ensure only Dashboard tab is visible at first load
document.addEventListener("DOMContentLoaded", function() {
    createTimeline();
    openTab('dashboard');
});
