// 宣告五種遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

// 宣告四種花色圖案之陣列
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]


//【VIEW視圖模塊區】**********************************
const view = {

  // 取得牌背
  // 新增dataset:data-index --->取得每張牌自己的號碼
  getCardBackElement(index) {
    return `<div data-index="${index}" class="card back"></div>`;
  },

  // 取得牌面
  getCardContent(index) {
    // 00-12：黑桃 1-13
    // 13-25：愛心 1-13
    // 26-38：方塊 1-13
    // 39-51：梅花 1-13
    const number = this.transformNumber((index % 13) + 1);
    const symbol = Symbols[Math.floor(index / 13)];
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>
    `;
  },

  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return number;
    }
  },

  displayCards(indexes) {
    const rootElement = document.querySelector('#cards');
    rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => this.getCardBackElement(index)).join('');
  },

  // flipCard(card)
  // ---> flipCard(1, 2, 3, 4, 5, ...)
  // ---> cards [1, 2, 3, 4, 5, ...]
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back');
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return
      }
      // 回傳背面
      card.classList.add('back');
      card.innerHTML = null;
    })
  },

  // 配對相同時執行的方法: 改變卡片的底色
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired');
    })
  },

  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), {once: true})
    })
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>COMPLETE!!!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}


//【MODEL資料管理模塊區】**********************************
const model = {
  // 這個陣列只丟兩個，就是翻第一張牌跟翻第二張牌的值
  revealedCards: [],

  // 透過比對陣列裡兩個值 % 13的餘數是否一樣，一樣表示牌面數字相同，例如 2 % 13 餘數 2 === 15 % 13 餘數 2
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13;
  },

  score: 0,
  triedTimes: 0
}


//【CONTROLLER控制模塊區】**********************************
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 依照不同的遊戲狀態，做不同的行為判斷
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        // 將遊戲狀態設成: 等待第二次翻牌
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        // 翻牌次數計算
        view.renderTriedTimes((++model.triedTimes))
        view.flipCards(card)
        model.revealedCards.push(card)
        
        // 判斷配對是否相同
        if (model.isRevealedCardsMatched()) {
          // 配對相同
          view.renderScore((model.score += 10))
          this.currentState = GAME_STATE.CardsMatched;
          view.pairCards(...model.revealedCards);
          // 翻完後要記得清空牌組，以便下次翻2張牌用
          model.revealedCards = [];
          // 若牌全翻完則出現結束畫面，遊戲狀態設成: 遊戲結束
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          // 將遊戲狀態設為: 等待第一次翻牌
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對不同
          this.currentState = GAME_STATE.CardsMatchFailed;
          view.appendWrongAnimation(...model.revealedCards)
          // setTimeout()方法的第一個參數必須視function名本身--->後面不能加()
          // 第二個參數: 讓翻回去的時間延遲 800毫秒(0.8秒)
          setTimeout(this.resetCards, 800);
        }
        break
    }

    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index));
  },

  // [優化]將重複動作的功能整合成一個方法:
  // 1.先把已翻開但配對不相同的兩張牌翻回去
  // 2.清空牌組，以便下一次翻兩張牌存入
  // 3.將遊戲狀態設成: 等待第一次翻牌
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    // 由於setTimeout是瀏覽器提供的方法，經由該方法所呼叫的方法，其this指向瀏覽器，所以這邊要改用controller
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//【工具模塊區】**********************************
const utility = {
  //讓牌組隨機組合
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1)); //這邊加上終止分號，避免程式自行判斷與後面的[]誤以為是一起的，但我覺得應該養成都加上分號的習慣
      
      /* 若要實現前後交換，早期使用的是TEMP技巧
      temp = number[index]
      number[index] = number[randomIndex]
      number[randomIndex] = temp
      */
     //用ES6結構賦值的語法就能簡單實現陣列裡前後交換的功能
     [number[index], number[randomIndex]] = [number[randomIndex], number[index]];
    }
    return number;
  }
}

// 先在畫面上顯示隨機順序之53張牌
controller.generateCards();

// DOM選取所有牌組，再每張牌都來監聽
//querySelectorAll() 方法回傳的是一個類陣列(Array-Like)，無法使用map()
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card);
  })
})