const params = new URLSearchParams(window.location.search);
const boxId = parseInt(params.get("id")) || 1; // default = 1

fetch("../data/bookBoxData.json")
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
    // const imgContainer = document.getElementById("boxImages");
    // box.img.forEach(src => {
    //     const img = document.createElement("img");
    //     img.src = src;
    //     imgContainer.appendChild(img);
    // });

    // Rate
    // const rateContainer = document.getElementById("rateAvg");

    // const reviewDiv = document.createElement("div");
    // reviewDiv.classList.add("rate");

    // const rateDiv = document.createElement("div");
    // rateContainer.appendChild(rateDiv);

    const stars = document.querySelectorAll('.stars i'); 
    stars.forEach((star, index1) => { 
      star.addEventListener("click", () => { 
        stars.forEach((star, index2) => { 
          index1 >= index2 ? star.classList.add("active") : star.classList.remove("active"); 
        }); 
      }); 
    });

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

// --- Swap featured image when a thumbnail is clicked ---
(function attachThumbSwap(){
  const featured = document.getElementById('featuredImg');
  const thumbs = document.getElementById('boxImages');
  if (!featured || !thumbs) return;
  thumbs.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    const old = featured.src;
    featured.src = img.src;
    // optional: swap thumb with previous featured (keeps grid lively)
    img.src = old;
  });
})();

// --- Simple chat input (adds to #messages) ---
(function attachChatInput(){
  const list = document.getElementById('messages');
  const ta = document.getElementById('chatText');
  const send = document.getElementById('sendBtn');
  if (!list || !ta || !send) return;

  function addMessage(text){
    const item = document.createElement('div');
    item.className = 'chatItem';
    const when = new Date().toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    item.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="who">You</div>
        <div class="text">${text}</div>
      </div>
      <div class="when">${when}</div>
    `;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  send.addEventListener('click', () => {
    const text = ta.value.trim();
    if(!text) return;
    addMessage(text);
    ta.value = '';
    ta.style.height = '44px';
  });

  // autosize
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  });
})();
