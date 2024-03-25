if (window.matchMedia("(max-width: 768px)").matches) {
  //작은화면일때

  const app = new PIXI.Application({ resizeTo: window });

  document.getElementById("animation-container").appendChild(app.view);

  const starTexture = PIXI.Texture.from("https://pixijs.com/assets/star.png");

  const starAmount = 300;
  let cameraZ = 0;
  const fov = 20;
  const baseSpeed = 0.05;
  let speed = 0;
  let warpSpeed = 0;
  const starStretch = 5;
  const starBaseSize = 0.04;

  const stars = [];

  for (let i = 0; i < starAmount; i++) {
    const star = {
      sprite: new PIXI.Sprite(starTexture),
      z: 0,
      x: 0,
      y: 0,
    };

    star.sprite.anchor.x = 0.5;
    star.sprite.anchor.y = 0.7;
    randomizeStar(star, true);
    app.stage.addChild(star.sprite);
    stars.push(star);
  }

  function randomizeStar(star, initial) {
    star.z = initial
      ? Math.random() * 2000
      : cameraZ + Math.random() * 1000 + 2000;

    const deg = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 1;

    star.x = Math.cos(deg) * distance;
    star.y = Math.sin(deg) * distance;
  }

  let scrollingTimeout;

  function handleWheel(event) {
    warpSpeed = event.deltaY > 0 ? 1 : -1;

    clearTimeout(scrollingTimeout);

    scrollingTimeout = setTimeout(function () {
      warpSpeed = 0;
    }, 100);
  }

  document.addEventListener("wheel", handleWheel);

  app.ticker.add((delta) => {
    // speed 갱신
    speed += (warpSpeed - speed) / 20;

    // 카메라 위치 업데이트
    cameraZ += delta * 10 * (speed + baseSpeed);

    for (let i = 0; i < starAmount; i++) {
      const star = stars[i];

      if (star.z < cameraZ) randomizeStar(star);

      const z = star.z - cameraZ;

      star.sprite.x =
        star.x * (fov / z) * app.renderer.screen.width +
        app.renderer.screen.width / 2;
      star.sprite.y =
        star.y * (fov / z) * app.renderer.screen.width +
        app.renderer.screen.height / 2;

      const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
      const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
      const distanceCenter = Math.sqrt(
        dxCenter * dxCenter + dyCenter * dyCenter
      );
      const distanceScale = Math.max(0, (2000 - z) / 2000);

      star.sprite.scale.x = distanceScale * starBaseSize;
      star.sprite.scale.y =
        distanceScale * starBaseSize +
        (distanceScale * speed * starStretch * distanceCenter) /
          app.renderer.screen.width;
      star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
    }
  });

  //가로스크롤

  const horizontal = document.querySelector("#horizontal");
  const sections = gsap.utils.toArray("#horizontal > section");

  gsap.to(sections, {
    xPercent: -100 * (sections.length - 1),
    ease: "none",
    scrollTrigger: {
      trigger: horizontal,
      start: "top top",
      end: () => "+=" + (horizontal.offsetWidth - innerWidth),
      pin: true,
      scrub: 0.5,
      snap: {
        snapTo: 1 / (sections.length - 1),
        inertia: false,
        duration: { min: 0.1, max: 0.1 },
      },
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // nav 이동 및 스타일

  const links = document.querySelectorAll("#paral_nav ul li a");

  links.forEach((link) => {
    const element = document.querySelector(link.getAttribute("href"));

    const linkST = ScrollTrigger.create({
      trigger: element,
      start: "top top",
    });

    ScrollTrigger.create({
      trigger: element,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => setActive(link),
    });

    link.addEventListener("click", (e) => {
      e.preventDefault();
      gsap.to(window, {
        duration: 1,
        scrollTo: linkST.start,
        overwrite: "auto",
      });
    });
  });

  function setActive(link) {
    links.forEach((el) => el.classList.remove("on"));
    link.classList.add("on");
  }

  // 네비게이션 휠 이벤트

  const nav = document.getElementById("paral_nav");
  let timer;

  window.addEventListener("wheel", function (event) {
    nav.style.top = "-150px"; // 원하는 만큼 이동
    clearTimeout(timer);
    timer = setTimeout(() => {
      nav.style.top = "20px"; // 이동 후 위치
    }, 600);
  });

  const scrollline = document.querySelector(".scroll-line");

  function fillscrollline() {
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.clientHeight;
    const scrolled = window.scrollY;
    const percentScrolled = (scrolled / (fullHeight - windowHeight)) * 100;

    scrollline.style.width = percentScrolled + "%";
  }

  window.addEventListener("scroll", fillscrollline);
  /*--------------------
Get Mouse
--------------------*/
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, dir: "" };
  let clicked = false;
  const getMouse = (e) => {
    mouse = {
      x:
        e.clientX ||
        e.pageX ||
        e.touches[0].pageX ||
        0 ||
        window.innerWidth / 2,
      y:
        e.clientY ||
        e.pageY ||
        e.touches[0].pageY ||
        0 ||
        window.innerHeight / 2,
      dir: getMouse.x > e.clientX ? "left" : "right",
    };
  };
  ["mousemove", "touchstart", "touchmove"].forEach((e) => {
    window.addEventListener(e, getMouse);
  });
  window.addEventListener("mousedown", (e) => {
    e.preventDefault();
    clicked = true;
  });
  window.addEventListener("mouseup", () => {
    clicked = false;
  });

  /*--------------------
Ghost Follow
--------------------*/
  class GhostFollow {
    constructor(options) {
      Object.assign(this, options);

      this.el = document.querySelector("#ghost");
      this.mouth = document.querySelector(".ghost__mouth");
      this.eyes = document.querySelector(".ghost__eyes");
      this.pos = {
        x: 0,
        y: 0,
      };
    }

    follow() {
      this.distX = mouse.x - this.pos.x;
      this.distY = mouse.y - this.pos.y;

      this.velX = this.distX / 8;
      this.velY = this.distY / 8;

      this.pos.x += this.distX / 10;
      this.pos.y += this.distY / 10;

      this.skewX = map(this.velX, 0, 100, 0, -50);
      this.scaleY = map(this.velY, 0, 100, 1, 2.0);
      this.scaleEyeX = map(Math.abs(this.velX), 0, 100, 1, 1.2);
      this.scaleEyeY = map(Math.abs(this.velX * 2), 0, 100, 1, 0.1);
      this.scaleMouth = Math.min(
        Math.max(
          map(Math.abs(this.velX * 1.5), 0, 100, 0, 10),
          map(Math.abs(this.velY * 1.2), 0, 100, 0, 5)
        ),
        2
      );

      if (clicked) {
        this.scaleEyeY = 0.4;
        this.scaleMouth = -this.scaleMouth;
      }

      this.el.style.transform =
        "translate(" +
        this.pos.x +
        "px, " +
        this.pos.y +
        "px) scale(.7) skew(" +
        this.skewX +
        "deg) rotate(" +
        -this.skewX +
        "deg) scaleY(" +
        this.scaleY +
        ")";
      this.eyes.style.transform =
        "translateX(-50%) scale(" + this.scaleEyeX + "," + this.scaleEyeY + ")";
      this.mouth.style.transform =
        "translate(" +
        (-this.skewX * 0.5 - 10) +
        "px) scale(" +
        this.scaleMouth +
        ")";
    }
  }

  /*--------------------
Map
--------------------*/
  function map(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  /*--------------------
Init
--------------------*/
  const cursor = new GhostFollow();

  /*--------------------
Render
--------------------*/
  const render = () => {
    requestAnimationFrame(render);
    cursor.follow();
  };
  render();
} else {

  //큰화면
  const app = new PIXI.Application({ resizeTo: window });

  document.getElementById("animation-container").appendChild(app.view); 

  const starTexture = PIXI.Texture.from("https://pixijs.com/assets/star.png");

  const starAmount = 600;
  let cameraZ = 0;
  const fov = 20;
  const baseSpeed = 0.06;
  let speed = 0;
  let warpSpeed = 0;
  const starStretch = 5;
  const starBaseSize = 0.05;

  const stars = [];

  for (let i = 0; i < starAmount; i++) {
    const star = {
      sprite: new PIXI.Sprite(starTexture),
      z: 0,
      x: 0,
      y: 0,
    };

    star.sprite.anchor.x = 0.5;
    star.sprite.anchor.y = 0.7;
    randomizeStar(star, true);
    app.stage.addChild(star.sprite);
    stars.push(star);
  }

  function randomizeStar(star, initial) {
    star.z = initial
      ? Math.random() * 2000
      : cameraZ + Math.random() * 1000 + 2000;

    const deg = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 1;

    star.x = Math.cos(deg) * distance;
    star.y = Math.sin(deg) * distance;
  }

  let scrollingTimeout;

  function handleWheel(event) {
    warpSpeed = event.deltaY > 0 ? 1 : -1;

    clearTimeout(scrollingTimeout);

    scrollingTimeout = setTimeout(function () {
      warpSpeed = 0;
    }, 100);
  }

  document.addEventListener("wheel", handleWheel);

  app.ticker.add((delta) => {
    // speed 갱신
    speed += (warpSpeed - speed) / 20;

    // 카메라 위치 업데이트
    cameraZ += delta * 10 * (speed + baseSpeed);

    for (let i = 0; i < starAmount; i++) {
      const star = stars[i];

      if (star.z < cameraZ) randomizeStar(star);

      const z = star.z - cameraZ;

      star.sprite.x =
        star.x * (fov / z) * app.renderer.screen.width +
        app.renderer.screen.width / 2;
      star.sprite.y =
        star.y * (fov / z) * app.renderer.screen.width +
        app.renderer.screen.height / 2;

      const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
      const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
      const distanceCenter = Math.sqrt(
        dxCenter * dxCenter + dyCenter * dyCenter
      );
      const distanceScale = Math.max(0, (2000 - z) / 2000);

      star.sprite.scale.x = distanceScale * starBaseSize;
      star.sprite.scale.y =
        distanceScale * starBaseSize +
        (distanceScale * speed * starStretch * distanceCenter) /
          app.renderer.screen.width;
      star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
    }
  });

  //가로스크롤

  const horizontal = document.querySelector("#horizontal");
  const sections = gsap.utils.toArray("#horizontal > section");

  gsap.to(sections, {
    xPercent: -100 * (sections.length - 1),
    ease: "none",
    scrollTrigger: {
      trigger: horizontal,
      start: "top top",
      end: () => "+=" + (horizontal.offsetWidth - innerWidth),
      pin: true,
      scrub: 0.5,
      snap: {
        snapTo: 1 / (sections.length - 1),
        inertia: false,
        duration: { min: 0.1, max: 0.1 },
      },
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // nav 이동 및 스타일

  const links = document.querySelectorAll("#paral_nav ul li a");

  links.forEach((link) => {
    const element = document.querySelector(link.getAttribute("href"));

    const linkST = ScrollTrigger.create({
      trigger: element,
      start: "top top",
    });

    ScrollTrigger.create({
      trigger: element,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => setActive(link),
    });

    link.addEventListener("click", (e) => {
      e.preventDefault();
      gsap.to(window, {
        duration: 1,
        scrollTo: linkST.start,
        overwrite: "auto",
      });
    });
  });

  function setActive(link) {
    links.forEach((el) => el.classList.remove("on"));
    link.classList.add("on");
  }

  const scrollline = document.querySelector(".scroll-line");

  function fillscrollline() {
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.clientHeight;
    const scrolled = window.scrollY;
    const percentScrolled = (scrolled / (fullHeight - windowHeight)) * 100;

    scrollline.style.width = percentScrolled + "%";
  }

  window.addEventListener("scroll", fillscrollline);

  // 네비게이션 휠 이벤트

  const nav = document.getElementById("paral_nav");
  let timer;

  window.addEventListener("wheel", function (event) {
    nav.style.top = "-150px"; // 원하는 만큼 이동
    clearTimeout(timer);
    timer = setTimeout(() => {
      nav.style.top = "20px"; // 이동 후 위치
    }, 600);
  });

  // 커서~~

  document.onclick = applyCursorRippleEffect;

  function applyCursorRippleEffect(e) {
    const ripple = document.createElement("div");

    ripple.className = "ripple";
    document.body.appendChild(ripple);

    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;

    ripple.style.animation = "ripple-effect .4s  linear";
    ripple.onanimationend = () => document.body.removeChild(ripple);
  }

  /*--------------------
Get Mouse
--------------------*/

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, dir: "" };
  let clicked = false;
  const getMouse = (e) => {
    mouse = {
      x:
        e.clientX ||
        e.pageX ||
        e.touches[0].pageX ||
        0 ||
        window.innerWidth / 2,
      y:
        e.clientY ||
        e.pageY ||
        e.touches[0].pageY ||
        0 ||
        window.innerHeight / 2,
      dir: getMouse.x > e.clientX ? "left" : "right",
    };
  };
  ["mousemove", "touchstart", "touchmove"].forEach((e) => {
    window.addEventListener(e, getMouse);
  });
  window.addEventListener("mousedown", (e) => {
    e.preventDefault();
    clicked = true;
  });
  window.addEventListener("mouseup", () => {
    clicked = false;
  });

  /*--------------------
Ghost Follow
--------------------*/
  class GhostFollow {
    constructor(options) {
      Object.assign(this, options);

      this.el = document.querySelector("#ghost");
      this.mouth = document.querySelector(".ghost__mouth");
      this.eyes = document.querySelector(".ghost__eyes");
      this.pos = {
        x: 0,
        y: 0,
      };
    }

    follow() {
      this.distX = mouse.x - this.pos.x;
      this.distY = mouse.y - this.pos.y;

      this.velX = this.distX / 8;
      this.velY = this.distY / 8;

      this.pos.x += this.distX / 10;
      this.pos.y += this.distY / 10;

      this.skewX = map(this.velX, 0, 100, 0, -50);
      this.scaleY = map(this.velY, 0, 100, 1, 2.0);
      this.scaleEyeX = map(Math.abs(this.velX), 0, 100, 1, 1.2);
      this.scaleEyeY = map(Math.abs(this.velX * 2), 0, 100, 1, 0.1);
      this.scaleMouth = Math.min(
        Math.max(
          map(Math.abs(this.velX * 1.5), 0, 100, 0, 10),
          map(Math.abs(this.velY * 1.2), 0, 100, 0, 5)
        ),
        2
      );

      if (clicked) {
        this.scaleEyeY = 0.4;
        this.scaleMouth = -this.scaleMouth;
      }

      this.el.style.transform =
        "translate(" +
        this.pos.x +
        "px, " +
        this.pos.y +
        "px) scale(.7) skew(" +
        this.skewX +
        "deg) rotate(" +
        -this.skewX +
        "deg) scaleY(" +
        this.scaleY +
        ")";
      this.eyes.style.transform =
        "translateX(-50%) scale(" + this.scaleEyeX + "," + this.scaleEyeY + ")";
      this.mouth.style.transform =
        "translate(" +
        (-this.skewX * 0.5 - 10) +
        "px) scale(" +
        this.scaleMouth +
        ")";
    }
  }

  /*--------------------
Map
--------------------*/
  function map(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  /*--------------------
Init
--------------------*/
  const cursor = new GhostFollow();

  /*--------------------
Render
--------------------*/
  const render = () => {
    requestAnimationFrame(render);
    cursor.follow();
  };
  render();
}

// ----------------------title animation------------------------

function recursiveAnimateTitle(string, currentIndex) {
  let title = document.querySelector("title");
  if (currentIndex < string.length) {
    title.innerHTML = string.substring(0, currentIndex + 1); // 현재 인덱스까지의 문자열로 제목을 설정
    setTimeout(function () {
      recursiveAnimateTitle(string, currentIndex + 1); // 다음 문자를 처리하기 위해 재귀 호출
    }, 100);
  } else {
    setTimeout(function () {
      animateTitle("KIM SUNG HUN Portfolio"); // 애니메이션을 끝내고 다시 시작
    }, 1000); // 1초 후에 애니메이션을 재시작
  }
}

function animateTitle(string) {
  document.querySelector("title").innerHTML = ""; // 제목을 비움
  recursiveAnimateTitle(string, 0); // 애니메이션 시작
}

animateTitle("KIM SUNG HUN Portfolio");

// favicon

var faviconRoute = "src/img/favicon/";
var faviconNames = [
  "s1.png",
  "s5.png",
  "s6.png",
  "s7.png",
  "s8.png",
  "s9.png",
  "s10.png",
  "s11.png",
  "s19.png",
  "s20.png",
  "s21.png",
  "s22.png",
  "s23.png",
  "s24.png",
  "s25.png",
];

var idx = 0;

setInterval(func, 300);

function func() {
  document
    .querySelector("#favicon")
    .setAttribute("href", faviconRoute + faviconNames[idx++]);
  idx %= faviconNames.length;
}


// section6 모달
// const prevButton = document.querySelector('.prev');
// const nextButton = document.querySelector('.next');
// const carousel = document.querySelector('.carousel_inner');

// let index = 0;

// prevButton.addEventListener('click', () => {
//    if (index === 0) return;
//    index -= 1;
   
//    carousel.style.transform = `translate3d(-${1222 * index}px, 0, 0)`;
// });

// nextButton.addEventListener('click', () => {
//    if (index === 4) return;
//    index += 1;
   
//    carousel.style.transform = `translate3d(-${1222 * index}px, 0, 0)`;
// });
