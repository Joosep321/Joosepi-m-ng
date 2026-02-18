// Global state
let balance = 10000;
let wins = 0;

// Update balance display
function updateBalance() {
    document.getElementById('balance').textContent = balance;
    document.getElementById('wins').textContent = wins;
    if (balance <= 0) {
        alert('Oled vale raha otsa saanud! Mäng läbi.');
        location.reload();
    }
}

// Money system helpers
function setMaxBet(inputId, maxLimit = 5000) {
    const input = document.getElementById(inputId);
    input.value = Math.min(balance, maxLimit);
}

function validateBet(betAmount, maxBet = 5000) {
    if (betAmount < 1) {
        alert('Panus peab olema vähemalt 1!');
        return false;
    }
    if (betAmount > balance) {
        alert(`Sinu saldo on ${balance}. Ei saa panustada rohkem!`);
        return false;
    }
    if (betAmount > maxBet) {
        alert(`Maksimaalне panus on ${maxBet}!`);
        return false;
    }
    return true;
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const gameName = e.target.dataset.game;
        document.querySelectorAll('.game-screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(gameName).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

// Game cards navigation
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const gameName = card.dataset.game;
        document.querySelectorAll('.game-screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(gameName).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-game="${gameName}"]`).classList.add('active');
    });
});

// ============== SLOTS ==============
const slotsGame = {
    symbols: ['🍎', '🍇', '🍋', '🍊', '⭐', '🔔'],
    spinning: false,

    spin() {
        const bet = parseInt(document.getElementById('slots-bet').value);
        if (!validateBet(bet, 5000)) return;

        if (this.spinning) return;

        balance -= bet;
        this.spinning = true;
        document.getElementById('slots-message').textContent = 'Keeratakse...';
        document.getElementById('slots-message').className = 'message';

        const reels = [1, 2, 3];
        const results = [];

        reels.forEach((reel, index) => {
            setTimeout(() => {
                const result = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                results.push(result);
                document.getElementById(`reel${reel}`).textContent = result;
                document.getElementById(`reel${reel}`).classList.add('spinning');

                if (index === 2) {
                    setTimeout(() => {
                        this.checkWin(results, bet);
                    }, 500);
                }
            }, index * 200);
        });
    },

    checkWin(results, bet) {
        this.spinning = false;
        document.querySelectorAll('.reel').forEach(r => r.classList.remove('spinning'));

        let payout = 0;
        const message = document.getElementById('slots-message');

        if (results[0] === results[1] && results[1] === results[2]) {
            const symbol = results[0];
            const multipliers = {
                '🍎': 50,
                '🍇': 30,
                '🍋': 20,
                '🍊': 15,
                '⭐': 75,
                '🔔': 100
            };
            payout = bet * (multipliers[symbol] || 10);
            message.textContent = `🎉 JÄCKPOT! ${symbol} ${symbol} ${symbol}! Voitsid ${payout} vale raha!`;
            message.className = 'message win';
            wins++;
        } else {
            message.textContent = 'Kahjuks tavaline.';
            message.className = 'message loss';
        }

        balance += payout;
        updateBalance();

        setTimeout(() => {
            document.getElementById('slots-message').textContent = '';
        }, 3000);
    }
};

// ============== BLACKJACK ==============
const blackjackGame = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    bet: 0,
    gameActive: false,

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        for (let i = 0; i < 6; i++) {
            for (let suit of suits) {
                for (let value of values) {
                    this.deck.push({ value, suit });
                }
            }
        }
        this.shuffle();
    },

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    getCard() {
        if (this.deck.length < 10) this.createDeck();
        return this.deck.pop();
    },

    cardValue(card) {
        if (card.value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        return parseInt(card.value);
    },

    handValue(hand) {
        let value = 0;
        let aces = 0;
        for (let card of hand) {
            value += this.cardValue(card);
            if (card.value === 'A') aces++;
        }
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        return value;
    },

    displayCard(card) {
        const div = document.createElement('div');
        div.className = 'card';
        div.textContent = card.value + card.suit;
        if (card.suit === '♥' || card.suit === '♦') div.classList.add('red');
        else div.classList.add('black');
        return div;
    },

    startRound() {
        const betAmount = parseInt(document.getElementById('bj-bet').value);
        if (!validateBet(betAmount, 5000)) return;
        
        this.bet = betAmount;
        balance -= betAmount;
        this.playerHand = [this.getCard(), this.getCard()];
        this.dealerHand = [this.getCard(), this.getCard()];
        this.gameActive = true;

        this.updateDisplay();
        document.querySelector('#blackjack .betting-section').style.display = 'none';
        document.getElementById('bj-game').style.display = 'block';
    },

    updateDisplay() {
        const playerCards = document.getElementById('player-cards');
        const dealerCards = document.getElementById('dealer-cards');
        playerCards.innerHTML = '';
        dealerCards.innerHTML = '';

        for (let card of this.playerHand) {
            playerCards.appendChild(this.displayCard(card));
        }

        for (let i = 0; i < this.dealerHand.length; i++) {
            if (i === 0 || !this.gameActive) {
                dealerCards.appendChild(this.displayCard(this.dealerHand[i]));
            } else {
                const div = document.createElement('div');
                div.className = 'card';
                div.textContent = '?';
                dealerCards.appendChild(div);
            }
        }

        document.getElementById('player-total').textContent = `Summa: ${this.handValue(this.playerHand)}`;
        if (this.gameActive) {
            document.getElementById('dealer-total').textContent = '?';
        } else {
            document.getElementById('dealer-total').textContent = `Summa: ${this.handValue(this.dealerHand)}`;
        }
    },

    hit() {
        if (!this.gameActive) return;
        this.playerHand.push(this.getCard());
        this.updateDisplay();
        if (this.handValue(this.playerHand) > 21) {
            this.endGame();
        }
    },

    stand() {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.updateDisplay();

        while (this.handValue(this.dealerHand) < 17) {
            this.dealerHand.push(this.getCard());
            this.updateDisplay();
        }

        this.endGame();
    },

    endGame() {
        this.gameActive = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;

        const playerValue = this.handValue(this.playerHand);
        const dealerValue = this.handValue(this.dealerHand);

        let message = '';
        let winnings = 0;

        if (playerValue > 21) {
            message = 'Ületasid 21! Kahju!';
        } else if (dealerValue > 21) {
            message = 'Dealer ületas 21! Sa võitsid!';
            winnings = this.bet * 2;
            wins++;
        } else if (playerValue > dealerValue) {
            message = 'Sa võitsid!';
            winnings = this.bet * 2;            wins++;        } else if (dealerValue > playerValue) {
            message = 'Dealer võitis!';
        } else {
            message = 'Viik!';
            winnings = this.bet;
        }

        balance += winnings;
        updateBalance();

        document.getElementById('bj-message').textContent = message;
        document.getElementById('bj-message').className = 'message ' + 
            (winnings >= this.bet ? 'win' : winnings > 0 ? 'win' : 'loss');

        setTimeout(() => {
            document.querySelector('#blackjack .betting-section').style.display = 'flex';
            document.getElementById('bj-game').style.display = 'none';
            document.getElementById('bj-message').textContent = '';
            document.getElementById('hit-btn').disabled = false;
            document.getElementById('stand-btn').disabled = false;
        }, 3000);
    }
};

// ============== POKER ==============
const pokerGame = {
    deck: [],
    hand: [],
    held: [false, false, false, false, false],
    bet: 0,
    payouts: {
        'Royal Flush': 250,
        'Straight Flush': 50,
        'Four of a Kind': 25,
        'Full House': 9,
        'Flush': 6,
        'Straight': 4,
        'Three of a Kind': 3,
        'Two Pair': 2,
        'Pair': 1,
        'High Card': 0
    },

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({ value, suit });
            }
        }
        this.shuffle();
    },

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    displayCard(card, index) {
        const div = document.createElement('div');
        div.className = 'card';
        div.textContent = card.value + card.suit;
        if (card.suit === '♥' || card.suit === '♦') div.classList.add('red');
        else div.classList.add('black');
        div.style.cursor = 'pointer';
        div.style.opacity = this.held[index] ? '0.5' : '1';
        div.addEventListener('click', () => this.toggleHold(index));
        return div;
    },

    startRound() {
        const betAmount = parseInt(document.getElementById('poker-bet').value);
        if (!validateBet(betAmount, 5000)) return;

        this.bet = betAmount;
        balance -= betAmount;
        this.held = [false, false, false, false, false];
        this.createDeck();
        this.hand = [this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop()];

        this.displayHand();
        document.querySelector('#poker .betting-section').style.display = 'none';
        document.getElementById('poker-game').style.display = 'block';

        const buttons = document.getElementById('poker-buttons');
        buttons.innerHTML = '<button onclick="pokerGame.draw()">Vahetada</button>';
    },

    displayHand() {
        const handDiv = document.getElementById('poker-hand');
        handDiv.innerHTML = '';
        for (let i = 0; i < this.hand.length; i++) {
            handDiv.appendChild(this.displayCard(this.hand[i], i));
        }
    },

    toggleHold(index) {
        this.held[index] = !this.held[index];
        this.displayHand();
    },

    draw() {
        for (let i = 0; i < this.hand.length; i++) {
            if (!this.held[i]) {
                this.hand[i] = this.deck.pop();
            }
        }
        this.displayHand();
        document.getElementById('poker-buttons').innerHTML = '';
        this.evaluateHand();
    },

    evaluateHand() {
        const hand = this.hand;
        const values = hand.map(c => this.cardValueNum(c));
        const suits = hand.map(c => c.suit);
        
        let ranking = this.rankHand(values, suits);
        let payout = this.payouts[ranking] * this.bet;
        
        balance += payout;
        if (payout > 0) wins++;
        updateBalance();

        const message = `${ranking}! Voitsid: ${payout}€`;
        document.getElementById('poker-message').textContent = message;
        document.getElementById('poker-message').className = 'message ' + (payout > 0 ? 'win' : 'loss');

        setTimeout(() => {
            document.querySelector('#poker .betting-section').style.display = 'flex';
            document.getElementById('poker-game').style.display = 'none';
            document.getElementById('poker-message').textContent = '';
        }, 3000);
    },

    cardValueNum(card) {
        if (card.value === 'A') return 14;
        if (card.value === 'K') return 13;
        if (card.value === 'Q') return 12;
        if (card.value === 'J') return 11;
        return parseInt(card.value);
    },

    rankHand(values, suits) {
        values.sort((a, b) => b - a);
        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = this.isStraight(values);
        const counts = this.getValueCounts(values);
        const pairs = Object.values(counts).filter(c => c === 2).length;
        const threes = Object.values(counts).some(c => c === 3);
        const fours = Object.values(counts).some(c => c === 4);

        if (isFlush && isStraight && values[0] === 14) return 'Royal Flush';
        if (isFlush && isStraight) return 'Straight Flush';
        if (fours) return 'Four of a Kind';
        if (threes && pairs) return 'Full House';
        if (isFlush) return 'Flush';
        if (isStraight) return 'Straight';
        if (threes) return 'Three of a Kind';
        if (pairs === 2) return 'Two Pair';
        if (pairs === 1) return 'Pair';
        return 'High Card';
    },

    isStraight(values) {
        for (let i = 0; i < 4; i++) {
            if (values[i] - values[i + 1] !== 1) {
                if (!(values[0] === 14 && values[4] === 2)) return false;
            }
        }
        return true;
    },

    getValueCounts(values) {
        let counts = {};
        for (let v of values) {
            counts[v] = (counts[v] || 0) + 1;
        }
        return counts;
    }
};

// ============== ROULETTE ==============
const rouletteGame = {
    spinning: false,
    wheelRotation: 0,

    spin() {
        const number = parseInt(document.getElementById('roulette-number').value);
        const bet = parseInt(document.getElementById('roulette-bet').value);

        if (number < 0 || number > 36) {
            alert('Number peab olema 0-36 vahel!');
            return;
        }
        if (!validateBet(bet, 5000)) return;

        if (this.spinning) return;

        this.spinning = true;
        balance -= bet;

        const wheel = document.getElementById('wheel');
        const spins = Math.floor(Math.random() * 5) + 5;
        const winningNumber = Math.floor(Math.random() * 37);
        const degreesPerNumber = 360 / 37;
        const rotation = spins * 360 + (winningNumber * degreesPerNumber);

        wheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        wheel.style.transform = `rotate(${rotation}deg)`;

        setTimeout(() => {
            this.spinning = false;
            this.checkWinner(number, winningNumber, bet);
        }, 3000);
    },

    checkWinner(playerNumber, winningNumber, bet) {
        const message = document.getElementById('roulette-message');

        if (playerNumber === winningNumber) {
            const payout = bet * 36;
            balance += payout;
            message.textContent = `🎉 Arvasin õigesti! Numberi ${winningNumber}! Voitsid ${payout} vale raha!`;
            message.className = 'message win';
            wins++;
        } else {
            message.textContent = `Välja kukkus ${winningNumber}. Kahju, sa panustaad ${playerNumber}le.`;
            message.className = 'message loss';
        }

        updateBalance();

        setTimeout(() => {
            document.getElementById('roulette-message').textContent = '';
        }, 3000);
    }
};

// ============== DICE ==============
const diceGame = {
    rolling: false,

    roll() {
        const bet = parseInt(document.getElementById('dice-bet').value);
        if (!validateBet(bet, 5000)) return;

        if (this.rolling) return;

        this.rolling = true;
        balance -= bet;
        updateBalance();

        const dice1 = document.getElementById('dice1');
        const dice2 = document.getElementById('dice2');
        let rolls = 0;

        const rollInterval = setInterval(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            dice1.textContent = d1;
            dice2.textContent = d2;
            dice1.classList.add('rolling');
            dice2.classList.add('rolling');
            rolls++;

            if (rolls >= 15) {
                clearInterval(rollInterval);
                dice1.classList.remove('rolling');
                dice2.classList.remove('rolling');
                this.checkWin(d1, d2, bet);
                this.rolling = false;
            }
        }, 50);
    },

    checkWin(d1, d2, bet) {
        const sum = d1 + d2;
        const payouts = { 2: 10, 3: 5, 4: 3, 5: 2, 6: 2, 12: 10 };
        const multiplier = payouts[sum] || 0;
        const payout = bet * multiplier;

        const message = document.getElementById('dice-message');

        if (multiplier > 0) {
            balance += payout;
            message.textContent = `🎉 Summa: ${sum}! Voitsid ${payout} vale raha!`;
            message.className = 'message win';
            wins++;
        } else {
            message.textContent = `Summa: ${sum}. Kahju!`;
            message.className = 'message loss';
        }

        updateBalance();
        setTimeout(() => {
            document.getElementById('dice-message').textContent = '';
        }, 3000);
    }
};

// ============== COIN FLIP ==============
const coinGame = {
    flipping: false,

    flip(choice) {
        const bet = parseInt(document.getElementById('coin-bet').value);
        if (!validateBet(bet, 5000)) return;

        if (this.flipping) return;

        this.flipping = true;
        balance -= bet;
        updateBalance();

        const coin = document.getElementById('coin-visual');
        const message = document.getElementById('coin-message');
        
        coin.classList.add('flipping');

        setTimeout(() => {
            const result = Math.random() < 0.5 ? 'H' : 'T';
            const resultText = result === 'H' ? '👤 Pead' : '🔙 Kirjad';
            coin.classList.remove('flipping');
            coin.textContent = resultText;

            if (choice === result) {
                const payout = bet * 2;
                balance += payout;
                message.textContent = `🎉 Õige! Valisid ${resultText}. Voitsid ${payout} vale raha!`;
                message.className = 'message win';
                wins++;
            } else {
                const choiceText = choice === 'H' ? '👤 Pead' : '🔙 Kirjad';
                message.textContent = `Välja kukkus ${resultText}. Sina panustasite ${choiceText}.`;
                message.className = 'message loss';
            }

            updateBalance();
            this.flipping = false;

            setTimeout(() => {
                document.getElementById('coin-message').textContent = '';
                coin.textContent = '🪙';
            }, 3000);
        }, 1000);
    }
};

// ============== HIGHER/LOWER ==============
const hlGame = {
    currentCard: null,
    nextCard: null,
    bet: 0,
    currentWinnings: 0,
    gameActive: false,
    deck: [],

    createDeck() {
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suits = ['♠', '♥', '♦', '♣'];
        this.deck = [];
        for (let value of values) {
            for (let suit of suits) {
                this.deck.push(value + suit);
            }
        }
        this.shuffle();
    },

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    getCard() {
        if (this.deck.length < 10) this.createDeck();
        return this.deck.pop();
    },

    getCardValue(card) {
        const val = card.charAt(0);
        if (val === 'A') return 1;
        if (val === 'J') return 11;
        if (val === 'Q') return 12;
        if (val === 'K') return 13;
        return parseInt(val);
    },

    startRound() {
        const bet = parseInt(document.getElementById('hl-bet').value);
        if (!validateBet(bet, 5000)) return;

        this.bet = bet;
        balance -= bet;
        this.currentWinnings = bet;
        this.gameActive = true;
        this.createDeck();
        this.currentCard = this.getCard();

        document.querySelector('#highlower .betting-section').style.display = 'none';
        document.getElementById('hl-game').style.display = 'block';
        document.getElementById('hl-current-card').textContent = this.currentCard;
        document.getElementById('hl-winnings').textContent = `Praegused võidud: ${this.currentWinnings}`;
        updateBalance();
    },

    guess(direction) {
        if (!this.gameActive) return;

        this.nextCard = this.getCard();
        const currentVal = this.getCardValue(this.currentCard);
        const nextVal = this.getCardValue(this.nextCard);

        document.getElementById('hl-next-card').textContent = this.nextCard;

        let isCorrect = false;
        if (direction === 'higher' && nextVal > currentVal) isCorrect = true;
        if (direction === 'lower' && nextVal < currentVal) isCorrect = true;

        const message = document.getElementById('hl-message');

        if (isCorrect) {
            this.currentWinnings = Math.floor(this.currentWinnings * 1.5);
            message.textContent = `✅ Õige! ${this.nextCard} on ${direction === 'higher' ? 'kõrgem' : 'madalam'} kui ${this.currentCard}`;
            message.className = 'message win';
            document.getElementById('hl-winnings').textContent = `Praegused võidud: ${this.currentWinnings}`;
            this.currentCard = this.nextCard;
            setTimeout(() => {
                document.getElementById('hl-next-card').textContent = '?';
                message.textContent = '';
            }, 2000);
        } else {
            this.endRound(false);
        }
    },

    endRound(win = true) {
        if (!this.gameActive) return;
        this.gameActive = false;

        const message = document.getElementById('hl-message');

        if (win) {
            balance += this.currentWinnings;
            message.textContent = `🎉 Väljusite! Teenisid ${this.currentWinnings} vale raha!`;
            message.className = 'message win';
            wins++;
        } else {
            message.textContent = `❌ Vale! Kaotasid!`;
            message.className = 'message loss';
        }

        updateBalance();

        setTimeout(() => {
            document.querySelector('#highlower .betting-section').style.display = 'flex';
            document.getElementById('hl-game').style.display = 'none';
            document.getElementById('hl-message').textContent = '';
            document.getElementById('hl-winnings').textContent = '';
            document.getElementById('hl-next-card').textContent = '?';
        }, 3000);
    }
};

// Initialize
blackjackGame.createDeck();
updateBalance();
