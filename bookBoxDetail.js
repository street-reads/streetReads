const params = new URLSearchParams(window.location.search);
const boxId = parseInt(params.get("id")) || 1; // default = 1

fetch("bookBoxData.json")
    .then(res => res.json())
    .then(data => {
        const box = data.find(b => b.id === boxId);
        if (!box) {
            document.getElementById("box-name").textContent = "BookBox not found";
            return;
        }

        // Fill title and address
        document.getElementById("boxName").textContent = box.name;
        document.getElementById("boxAddress").textContent = box.address;

        // Images
        const imgContainer = document.getElementById("boxImages");
        box.img.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            imgContainer.appendChild(img);
        });

        // Rate
        const rateContainer = document.getElementById("rateAvg");

        const reviewDiv = document.createElement("div");
        reviewDiv.classList.add("rate");

        const rateDiv = document.createElement("div");
        rateContainer.appendChild(rateDiv);



        // Reviews
        const reviewsContainer = document.getElementById("reviews");
        box.reviews.forEach(user => {
            const reviewDiv = document.createElement("div");
            reviewDiv.classList.add("review");
            reviewDiv.innerHTML = `
            <img src="${user.picture}">
            <strong>${user.name}</strong><br>
            <p>${user.comment}</p>
            `;
            reviewsContainer.appendChild(reviewDiv);
        });
    })
    .catch(err => console.error("Error loading JSON:", err));

const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn-close");

// close modal function
const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

// close the modal when the close button and overlay is clicked
closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

// close modal when the Esc key is pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// open modal function
const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};
// open modal event
openModalBtn.addEventListener("click", openModal);

