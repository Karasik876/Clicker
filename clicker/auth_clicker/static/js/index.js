/**
* Класс, в котором хранятся данные игры пользователя и основные методы взаимодействия с этими данными.
* Пусть вас не смущает слово function в начале, в JS так можно определять классы.
*/
function GameSession() {
    this.coins = 0
    this.click_power = 1
    this.auto_click_power = 0
    this.next_level_price = 10
    this.brs_power = 0.01
    this.brs_points = 0


    /** Метод для инициализации данных. Данные подгружаются с бэкенда. */
    this.init = function() {
        getCore().then(core => {
            this.coins = core.coins
            this.click_power = core.power
            this.auto_click_power = core.auto_click_power
            this.next_level_price = core.next_level_price
            this.brs_power = core.brs_power
            this.brs_points = core.brs_points
            render()
        })
    }
    /** Метод для добавления монеток. */
    this.add_coins = function(coins) {
        this.coins += coins
        this.check_levelup()
        render()
    }
    this.add_brs_points = function(brs_points){
        this.brs_points += brs_points
        render()
    }
    this.add_brs_power = function(brs_power){
        this.brs_power += brs_power
        render()
    }
    /** Метод для добавления невероятной мощи. */
    this.add_power = function(power) {
        this.click_power += power
        render()
    }
    /** Метод для добавления дружинника в отряд автоматизированных кликуш. */
    this.add_auto_power = function(power) {
        this.auto_click_power += power
        render()
    }
    /** Метод для проверки на повышения уровня. Отправка запроса на сохранение данных, если уровень повышен. */
    this.check_levelup = function() {
        if (this.coins >= this.next_level_price) {
            updateCoins(this.coins, this.auto_click_power, this.brs_points).then(core => {
                this.next_level_price = core.next_level_price
            })
        }
    }
}

let Game = new GameSession() // Экземпляр класса GameSession.

/** Функция обработки клика пользователя на какаши. */
function call_click() {
    Game.add_coins(Game.click_power)
}
function call_brs_click(){
    Game.add_brs_points(Game.brs_power)
}

/** Функция для обновления количества монет, невероятной мощи и дружинных кликуш в HTML-элементах. */
function render() {
    const coinsNode = document.getElementById('coins')
    const clickNode = document.getElementById('click_power')
    const autoClickNode = document.getElementById('auto_click_power')
    const brsPowerNode = document.getElementById('brs_power')
    const brsPointsNode = document.getElementById('brs_points')
    coinsNode.innerHTML = Game.coins
    clickNode.innerHTML = Game.click_power
    autoClickNode.innerHTML = Game.auto_click_power
    brsPowerNode.innerHTML = Game.brs_power
    brsPointsNode.innerHTML = Game.brs_points
}

/** Функция для обновления буста на фронтике. */
function update_boost(boost) {
    get_boosts()
    const boost_node = document.getElementById(`boost_${boost.id}`)
    boost_node.querySelector('#boost_level').innerText = boost.lvl
    boost_node.querySelector('#boost_power').innerText = boost.power
    boost_node.querySelector('#boost_brs_power').innerText = boost.brs_power
    boost_node.querySelector('#boost_price').innerText = boost.price

}

/** Функция для добавления буста на фронтике. */
function add_boost(parent, boost) {
    const button = document.createElement('button')
    button.setAttribute('class', `boost_${boost.type}`)
    button.setAttribute('id', `boost_${boost.id}`)
    button.setAttribute('onclick', `buy_boost(${boost.id})`)
    if (boost.type != 2){
        button.innerHTML = `
        <p>Уровень: <span id="boost_level">${boost.lvl}</span></p>
        <p>+<span id="boost_power">${boost.power}</span></p>
        <p><span id="boost_price">${boost.price}</span></p>
    `
    } else{
        button.innerHTML = `
        <p>Уровень: <span id="boost_level">${boost.lvl}</span></p>
        <p>+ ${boost.brs_power} в БРС</p>
        <span id="boost_brs_power"></span>
        <p><span id="boost_price">${boost.price}</span></p>
    `
    }

    parent.appendChild(button)
}

/** Функция для анимации элемента, по которому происходит клик. */
function click_animation(node, time_ms) {
    css_time = `.0${time_ms}s`
    node.style.cssText = `transition: all ${css_time} linear; transform: scale(0.95);`
    setTimeout(function() {
        node.style.cssText = `transition: all ${css_time} linear; transform: scale(1);`
    }, time_ms)
}

/** Функция получения данных об игре пользователя с бэкенда. */
function getCore() {
    return fetch('/core/', {
        method: 'GET'
    }).then(response => {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject(response)
    }).then(response => {
        return response.core
    }).catch(error => console.log(error))
}

/** Функция отправки данных о количестве монет пользователя на бэкенд. */
function updateCoins(current_coins, auto_click_power, brs_points) {
    const csrftoken = getCookie('csrftoken')
    return fetch('/update_coins/', {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            current_coins: current_coins,
            auto_click_power: auto_click_power,
            brs_points: brs_points
        })
    }).then(response => {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject(response)
    }).then(response => {
        if (response.is_levelup) {
            get_boosts()
        }
        return response.core
    }).catch(error => console.log(error))
}

/** Функция получения имеющихся бустов пользователя с бэкенда. */
function get_boosts() {
    return fetch('/boosts/', {
        method: 'GET'
    }).then(response => {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject(response)
    }).then(boosts => {
        const panel = document.getElementById('boosts-holder')
        panel.innerHTML = ''
        boosts.forEach(boost => {
            add_boost(panel, boost)
        })
    }).catch(error => console.log(error))
}

/** Функция покупки буста. */
function buy_boost(boost_id) {
    const csrftoken = getCookie('csrftoken')
    return fetch(`/boost/${boost_id}/`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            coins: Game.coins
        })
    }).then(response => {
        if (response.ok) return response.json()
        return Promise.reject(response)
    }).then(response => {
        if (response.error) return
        const old_boost_stats = response.old_boost_stats
        const new_boost_stats = response.new_boost_stats

        Game.add_coins(-old_boost_stats.price)
        if (old_boost_stats.type === 1) {
            Game.add_auto_power(old_boost_stats.power)
        } else if (old_boost_stats.type === 0) {
            Game.add_power(old_boost_stats.power)
        } else {
            Game.add_brs_power(old_boost_stats.brs_power)
        }

        update_boost(new_boost_stats) // Обновляем буст на фронтике.
    }).catch(err => console.log(err))
}

/** Функция обработки автоматического клика. */
function setAutoClick() {
    setInterval(function() {
        /** Этот код срабатывает раз в секунду. */
        Game.add_coins(Game.auto_click_power)
    }, 1000)
}

/** Функция обработки автоматического сохранения (отправки данных о количестве монет пользователя на бэкенд). */
function setAutoSave() {
    setInterval(function() {
        /** Этот код срабатывает раз в 1 сек. */
        updateCoins(Game.coins, Game.auto_click_power, Game.brs_points)

    }, 1000)
}

/**
    Функция для получения кукесов.
    Она нужна для того, чтобы получить токен пользователя, который хранится в cookie.
    Токен пользователя, в свою очередь, нужен для того, чтобы система распознала, что запросы защищены.
    Без него POST и PUT запросы выполняться не будут, потому что так захотел Django.
*/
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
* Эта функция автоматически вызывается сразу после загрузки страницы.
* В ней мы можем делать что угодно.
*/
window.onload = function () {
    Game.init() // Инициализация игры.
    setAutoClick() // Инициализация автоклика.
    setAutoSave() // Инициализация автосейва.
    get_boosts()
}




$(function() {
  // Vars
  var pointsA = [],
    pointsB = [],
    $canvas = null,
    canvas = null,
    context = null,
    vars = null,
    points = 8,
    viscosity = 20,
    mouseDist = 70,
    damping = 0.05,
    showIndicators = false;
    mouseX = 0,
    mouseY = 0,
    relMouseX = 0,
    relMouseY = 0,
    mouseLastX = 0,
    mouseLastY = 0,
    mouseDirectionX = 0,
    mouseDirectionY = 0,
    mouseSpeedX = 0,
    mouseSpeedY = 0;

  /**
   * Get mouse direction
   */
  function mouseDirection(e) {
    if (mouseX < e.pageX)
      mouseDirectionX = 1;
    else if (mouseX > e.pageX)
      mouseDirectionX = -1;
    else
      mouseDirectionX = 0;

    if (mouseY < e.pageY)
      mouseDirectionY = 1;
    else if (mouseY > e.pageY)
      mouseDirectionY = -1;
    else
      mouseDirectionY = 0;

    mouseX = e.pageX;
    mouseY = e.pageY;

    relMouseX = (mouseX - $canvas.offset().left);
    relMouseY = (mouseY - $canvas.offset().top);
  }
  $(document).on('mousemove', mouseDirection);

  /**
   * Get mouse speed
   */
  function mouseSpeed() {
    mouseSpeedX = mouseX - mouseLastX;
    mouseSpeedY = mouseY - mouseLastY;

    mouseLastX = mouseX;
    mouseLastY = mouseY;

    setTimeout(mouseSpeed, 50);
  }
  mouseSpeed();

  /**
   * Init button
   */
  function initButton() {
    // Get button
    var button = $('.btn-liquid');
    var buttonWidth = button.width();
    var buttonHeight = button.height();

    // Create canvas
    $canvas = $('<canvas></canvas>');
    button.append($canvas);

    canvas = $canvas.get(0);
    canvas.width = buttonWidth+100;
    canvas.height = buttonHeight+100;
    context = canvas.getContext('2d');

    // Add points

    var x = buttonHeight/2;
    for(var j = 1; j < points; j++) {
      addPoints((x+((buttonWidth-buttonHeight)/points)*j), 0);
    }
    addPoints(buttonWidth-buttonHeight/5, 0);
    addPoints(buttonWidth+buttonHeight/10, buttonHeight/2);
    addPoints(buttonWidth-buttonHeight/5, buttonHeight);
    for(var j = points-1; j > 0; j--) {
      addPoints((x+((buttonWidth-buttonHeight)/points)*j), buttonHeight);
    }
    addPoints(buttonHeight/5, buttonHeight);

    addPoints(-buttonHeight/10, buttonHeight/2);
    addPoints(buttonHeight/5, 0);
    // addPoints(x, 0);
    // addPoints(0, buttonHeight/2);

    // addPoints(0, buttonHeight/2);
    // addPoints(buttonHeight/4, 0);

    // Start render
    renderCanvas();
  }

  /**
   * Add points
   */
  function addPoints(x, y) {
    pointsA.push(new Point(x, y, 1));
    pointsB.push(new Point(x, y, 2));
  }

  /**
   * Point
   */
  function Point(x, y, level) {
    this.x = this.ix = 50+x;
    this.y = this.iy = 50+y;
    this.vx = 0;
    this.vy = 0;
    this.cx1 = 0;
    this.cy1 = 0;
    this.cx2 = 0;
    this.cy2 = 0;
    this.level = level;
  }

  Point.prototype.move = function() {
    this.vx += (this.ix - this.x) / (viscosity*this.level);
    this.vy += (this.iy - this.y) / (viscosity*this.level);

    var dx = this.ix - relMouseX,
      dy = this.iy - relMouseY;
    var relDist = (1-Math.sqrt((dx * dx) + (dy * dy))/mouseDist);

    // Move x
    if ((mouseDirectionX > 0 && relMouseX > this.x) || (mouseDirectionX < 0 && relMouseX < this.x)) {
      if (relDist > 0 && relDist < 1) {
        this.vx = (mouseSpeedX / 4) * relDist;
      }
    }
    this.vx *= (1 - damping);
    this.x += this.vx;

    // Move y
    if ((mouseDirectionY > 0 && relMouseY > this.y) || (mouseDirectionY < 0 && relMouseY < this.y)) {
      if (relDist > 0 && relDist < 1) {
        this.vy = (mouseSpeedY / 4) * relDist;
      }
    }
    this.vy *= (1 - damping);
    this.y += this.vy;
  };


  /**
   * Render canvas
   */
  function renderCanvas() {
    // rAF
    rafID = requestAnimationFrame(renderCanvas);

    // Clear scene
    context.clearRect(0, 0, $canvas.width(), $canvas.height());
    context.fillStyle = '#fff';
    context.fillRect(0, 0, $canvas.width(), $canvas.height());

    // Move points
    for (var i = 0; i <= pointsA.length - 1; i++) {
      pointsA[i].move();
      pointsB[i].move();
    }

    // Create dynamic gradient
    var gradientX = Math.min(Math.max(mouseX - $canvas.offset().left, 0), $canvas.width());
    var gradientY = Math.min(Math.max(mouseY - $canvas.offset().top, 0), $canvas.height());
    var distance = Math.sqrt(Math.pow(gradientX - $canvas.width()/2, 2) + Math.pow(gradientY - $canvas.height()/2, 2)) / Math.sqrt(Math.pow($canvas.width()/2, 2) + Math.pow($canvas.height()/2, 2));

    var gradient = context.createRadialGradient(gradientX, gradientY, 300+(300*distance), gradientX, gradientY, 0);
    gradient.addColorStop(0, '#102ce5');
    gradient.addColorStop(1, '#E406D6');

    // Draw shapes
    var groups = [pointsA, pointsB]

    for (var j = 0; j <= 1; j++) {
      var points = groups[j];

      if (j == 0) {
        // Background style
        context.fillStyle = '#1CE2D8';
      } else {
        // Foreground style
        context.fillStyle = gradient;
      }

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var nextP = points[i + 1];
        var val = 30*0.552284749831;

        if (nextP != undefined) {
          // if (nextP.ix > p.ix && nextP.iy < p.iy) {
          //  p.cx1 = p.x;
          //  p.cy1 = p.y-val;
          //  p.cx2 = nextP.x-val;
          //  p.cy2 = nextP.y;
          // } else if (nextP.ix > p.ix && nextP.iy > p.iy) {
          //  p.cx1 = p.x+val;
          //  p.cy1 = p.y;
          //  p.cx2 = nextP.x;
          //  p.cy2 = nextP.y-val;
          // }  else if (nextP.ix < p.ix && nextP.iy > p.iy) {
          //  p.cx1 = p.x;
          //  p.cy1 = p.y+val;
          //  p.cx2 = nextP.x+val;
          //  p.cy2 = nextP.y;
          // } else if (nextP.ix < p.ix && nextP.iy < p.iy) {
          //  p.cx1 = p.x-val;
          //  p.cy1 = p.y;
          //  p.cx2 = nextP.x;
          //  p.cy2 = nextP.y+val;
          // } else {

            p.cx1 = (p.x+nextP.x)/2;
            p.cy1 = (p.y+nextP.y)/2;
            p.cx2 = (p.x+nextP.x)/2;
            p.cy2 = (p.y+nextP.y)/2;

            context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
          //  continue;
          // }

          // context.bezierCurveTo(p.cx1, p.cy1, p.cx2, p.cy2, nextP.x, nextP.y);
        } else {
nextP = points[0];
            p.cx1 = (p.x+nextP.x)/2;
            p.cy1 = (p.y+nextP.y)/2;

            context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
        }
      }

      // context.closePath();
      context.fill();
    }

    if (showIndicators) {
      // Draw points
      context.fillStyle = '#000';
      context.beginPath();
      for (var i = 0; i < pointsA.length; i++) {
        var p = pointsA[i];

        context.rect(p.x - 1, p.y - 1, 2, 2);
      }
      context.fill();

      // Draw controls
      context.fillStyle = '#f00';
      context.beginPath();
      for (var i = 0; i < pointsA.length; i++) {
        var p = pointsA[i];

        context.rect(p.cx1 - 1, p.cy1 - 1, 2, 2);
        context.rect(p.cx2 - 1, p.cy2 - 1, 2, 2);
      }
      context.fill();
    }
  }

  // Init
  initButton();
});







