function ChainReaction(selector, width, height) {
  const BALL_RADIUS = 7;

  let $canvas = $("<canvas>");
  let ctx = $canvas[0].getContext("2d");

  let clickListeners = [];
  let touchListeners = [];

  let balls = {};
  let explosions = [];

  $(selector).width(width).height(height);

  $canvas
    .attr("width", width)
    .attr("height", height)
    .click((e) => {
      let offset = $(e.target).offset();
      let posX = e.pageX - offset.left;
      let posY = e.pageY - offset.top;
      try { clickListeners.forEach((listener) => listener(posX, posY)); }
      catch (err) { console.error(err); }
    })
    .appendTo(selector)
    ;

  let prevTime = performance.now();
  window.requestAnimationFrame(function loop() {
    let now = performance.now();
    let delta = now - prevTime;
    prevTime = now;

    ctx.clearRect(0, 0, width, height);

    let keys = Object.keys(balls)
    for (let i = 0; i < keys.length; i++) {
      let ball = balls[keys[i]];

      ball.posX += ball.speedX * (delta / 1000);
      ball.posY += ball.speedY * (delta / 1000);

      if (ball.posX < BALL_RADIUS) {
        ball.speedX = -ball.speedX;
        ball.posX = 2 * BALL_RADIUS - ball.posX;
      } else if (ball.posX > width - BALL_RADIUS) {
        ball.speedX = -ball.speedX;
        ball.posX = 2 * (width - BALL_RADIUS) - ball.posX;
      }

      if (ball.posY < BALL_RADIUS) {
        ball.speedY = -ball.speedY;
        ball.posY = 2 * BALL_RADIUS - ball.posY;
      } else if (ball.posY + BALL_RADIUS > height) {
        ball.speedY = -ball.speedY;
        ball.posY = 2 * (height - BALL_RADIUS) - ball.posY;
      }

      ctx.beginPath();
      ctx.fillStyle = ball.color;
      ctx.arc(ball.posX, ball.posY, BALL_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }

    explosions = explosions.filter(e => now - e.start < 2 * 1000);

    let touched = {};
    for (let i = 0; i < explosions.length; i++) {
      let explosion = explosions[i];
      let age = now - explosion.start;
      let explosionRadius = explosion.maxRadius * (age < 1000 ? age / 1000 : 1);

      for (let b = 0; b < keys.length; b++) {
        if (keys[b] in touched) continue;

        let ball = balls[keys[b]];
        let deltaX = ball.posX - explosion.posX
        let deltaY = ball.posY - explosion.posY
        let dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (explosionRadius + BALL_RADIUS > dist) {
          touched[ball.id] = ball;
        }
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 55, 55, ${age < 1800 ? 0.5 : (2000 - age) / 400})`;
      ctx.arc(explosion.posX, explosion.posY, explosionRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    try {
      let balls = Object.values(touched);
      for (let t = 0; t < balls.length; t++) {
        let ball = balls[t];
        for (let l = 0; l < touchListeners.length; l++) {
          let listener = touchListeners[l];
          listener(ball.posX, ball.posY, ball.id);
        }
      }
    }
    catch (err) { return console.error(err); }

    window.requestAnimationFrame(loop);
  });

  this.onClick = (listener) => {
    clickListeners.push(listener);

    return listener;
  };

  this.onTouchExplosion = (listener) => {
    touchListeners.push(listener);

    return listener;
  }

  let lastExplosion = 0;
  this.explode = (posX, posY, size) => {
    let now = performance.now();

    if (now - lastExplosion < 1 && explosions.length > 5) return;

    explosions.push({ posX, posY, size: 0, maxRadius: size, start: now });
    lastExplosion = now;
  };

  this.addBall = (ball) => {
    ball = Object.assign({
      id: (Math.random() + "").substr(2),
      posX: width * Math.random(),
      posY: height * Math.random(),
      speedX: 500 * Math.random() - 250,
      speedY: 500 * Math.random() - 250,
      color: "blue",
    }, ball || {});

    balls[ball.id] = ball;
  };

  this.removeBall = (ballId) => {
    delete balls[ballId];
  };

  this.toJson = () => {
    return {
      now: performance.now(),
      balls: { ...balls },
      explosions: explosions.map(e => ({ ...e }))
    };
  };

  this.fromJson = (json) => {
    now = performance.now();
    balls = { ...json.balls };
    explosions = json.explosions.map(e => ({ ...e, start: now - (json.now - e.start) }));
  };

  this.reset = () => {
    balls = {};
    explosions = [];
  };

  this.toBinary = (callback) => {
    return $canvas[0].toBlob(callback);
  };

  this.isEmpty = () => {
    return Object.keys(balls).length === 0;
  };

  this.ballCount = () => Object.keys(balls).length;
}
