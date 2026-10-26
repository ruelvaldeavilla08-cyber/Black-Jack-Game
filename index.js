let player = {
    name: "Awel",
    chips: 145
}
let cards = []
let sum = 0
let hasBlackJack = false
let isAlive = false
let messageEl = document.getElementById("message-el");
let sumEl = document.getElementById("sum-el")
let cardEl = document.getElementById("card-el")
let playerEl = document.getElementById("player-el")  

playerEl.textContent= player.name + ": $" + player.chips


function getRandomCard() {
    let randomNumber = Math.floor(Math.random() * 13) + 1

    if (randomNumber === 1) {
        return 11
    } else if (randomNumber > 10) {
        return 10
    } else {
        return randomNumber
    }
}

function startGame() {
    let firstCard = getRandomCard()
    let secondCard = getRandomCard()
    cards = [firstCard, secondCard]
    sum = firstCard + secondCard
    isAlive = true
    hasBlackJack = false
    
    renderGame();
}

function renderGame() {  
    while (sum > 21 && cards.includes(11)) {
        sum -= 10
        cards[cards.indexOf(11)] = 1
    }

    cardEl.textContent= "Cards: "
    for (let  i = 0; i < cards.length; i++ ) {
        cardEl.textContent+= cards[i] + " "     
    }
    sumEl.textContent= "Sum: "+ sum 
    let message

    if (sum <= 20) {
        message = "Do you want to draw a new card? 🙂"
    } else if (sum === 21) {
        message = "Wohoo! You've got Blackjack! 🥳"
        hasBlackJack = true
    } else {
        message = "You're out of the game! 😭"
        isAlive = false
    }

    messageEl.textContent= message
}

function newCard() {
    if (isAlive === true && hasBlackJack === false) {
        let card = getRandomCard()
        sum += card
        cards.push(card)
        renderGame() 
    }  
}
