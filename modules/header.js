function updateTime(){
    const time = document.getElementById("time");
    const dateElement = document.getElementById("date");
    const now = new Date();
    const hours = String(now.getHours()).padStart("2", 0);
    const minutes = String(now.getMinutes()).padStart("2", 0);
    const date = now.toLocaleDateString("de-DE");
    time.textContent = `${hours}:${minutes}`;
    dateElement.textContent = `${date}`;
    

}

setInterval(updateTime, 1000);

export { updateTime };

