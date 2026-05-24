const screens = document.querySelectorAll(".screen");
const appShell = document.querySelector("#app-shell");
const navButtons = document.querySelectorAll(".bottom-nav button");
const views = document.querySelectorAll(".view");
const toast = document.querySelector(".toast");
const segmentedButtons = document.querySelectorAll(".segmented button");

const messages = {
  notify: "มีงานรอตรวจ 5 รายการ, นักเรียนขาดเรียน 1 คน, หลักฐาน ว PA ใหม่ 2 รายการ",
  follow: "เปิดรายชื่อนักเรียนที่ต้องติดตามในหน่วยนี้",
  score: "วิเคราะห์คะแนน: พบกลุ่มเสริม 7 คน และกลุ่มต่อยอด 9 คน",
  "saved-evidence": "บันทึกหลักฐานเข้า ว PA Portfolio แล้ว",
  export: "สร้างไฟล์ PDF ตัวอย่างเรียบร้อย",
  "attendance-saved": "บันทึกการเข้าเรียนและเตรียมแจ้งผู้ปกครองแล้ว",
};

function setScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `screen-${name}`);
  });

  appShell.classList.toggle("is-active", name.startsWith("app-"));

  if (name === "home") {
    appShell.classList.add("is-active");
    showView("home");
  }

  if (name === "app-work") {
    appShell.classList.add("is-active");
    showView("work");
  }

  if (name === "app-pa") {
    appShell.classList.add("is-active");
    showView("pa");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showView(viewName) {
  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${viewName}`);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

document.querySelectorAll("[data-go]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    setScreen(item.dataset.go);
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    showToast(messages[button.dataset.action] || "เปิดหน้าต้นแบบแล้ว");
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setScreen(`app-${button.dataset.view}`);
    showView(button.dataset.view);
  });
});

segmentedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    segmentedButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    showToast(`กรองรายการ: ${button.textContent}`);
  });
});
