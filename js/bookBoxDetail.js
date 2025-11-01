// const params = new URLSearchParams(window.location.search);
// const boxId = parseInt(params.get("id")) || 1; // default = 1

// fetch("../data/bookBoxData.json")
//   .then(res => res.json())
//   .then(data => {
//     const box = data.find(b => b.id === boxId);
//     if (!box) {
//       document.getElementById("box-name").textContent = "BookBox not found";
//       return;
//     }

//     // Fill title and address
//     document.getElementById("boxName").textContent = box.name;
//     document.getElementById("boxAddress").textContent = box.address;

//     // Images
//     // const imgContainer = document.getElementById("boxImages");
//     // box.img.forEach(src => {
//     //     const img = document.createElement("img");
//     //     img.src = src;
//     //     imgContainer.appendChild(img);
//     // });

//     // Rate
//     // const rateContainer = document.getElementById("rateAvg");

//     // const reviewDiv = document.createElement("div");
//     // reviewDiv.classList.add("rate");

//     // const rateDiv = document.createElement("div");
//     // rateContainer.appendChild(rateDiv);

//     const stars = document.querySelectorAll('.stars i'); 
//     stars.forEach((star, index1) => { 
//       star.addEventListener("click", () => { 
//         stars.forEach((star, index2) => { 
//           index1 >= index2 ? star.classList.add("active") : star.classList.remove("active"); 
//         }); 
//       }); 
//     });

//     // Reviews
//     const reviewsContainer = document.getElementById("reviews");
//     box.reviews.forEach(user => {
//       const reviewDiv = document.createElement("div");
//       reviewDiv.classList.add("review");
//       reviewDiv.innerHTML = `
//             <img src="${user.picture}">
//             <strong>${user.name}</strong><br>
//             <p>${user.comment}</p>
//             `;
//       reviewsContainer.appendChild(reviewDiv);
//     });
//   })
//   .catch(err => console.error("Error loading JSON:", err));

// const modal = document.querySelector(".modal");
// const overlay = document.querySelector(".overlay");
// const openModalBtn = document.querySelector(".btn-open");
// const closeModalBtn = document.querySelector(".btn-close");

// // close modal function
// const closeModal = function () {
//   modal.classList.add("hidden");
//   overlay.classList.add("hidden");
// };

// // close the modal when the close button and overlay is clicked
// closeModalBtn.addEventListener("click", closeModal);
// overlay.addEventListener("click", closeModal);

// // close modal when the Esc key is pressed
// document.addEventListener("keydown", function (e) {
//   if (e.key === "Escape" && !modal.classList.contains("hidden")) {
//     closeModal();
//   }
// });

// // open modal function
// const openModal = function () {
//   modal.classList.remove("hidden");
//   overlay.classList.remove("hidden");
// };
// // open modal event
// openModalBtn.addEventListener("click", openModal);

// // --- Swap featured image when a thumbnail is clicked ---
// (function attachThumbSwap(){
//   const featured = document.getElementById('featuredImg');
//   const thumbs = document.getElementById('boxImages');
//   if (!featured || !thumbs) return;
//   thumbs.addEventListener('click', (e) => {
//     const img = e.target.closest('img');
//     if (!img) return;
//     const old = featured.src;
//     featured.src = img.src;
//     // optional: swap thumb with previous featured (keeps grid lively)
//     img.src = old;
//   });
// })();

// // --- Simple chat input (adds to #messages) ---
// (function attachChatInput(){
//   const list = document.getElementById('messages');
//   const ta = document.getElementById('chatText');
//   const send = document.getElementById('sendBtn');
//   if (!list || !ta || !send) return;

//   function addMessage(text){
//     const item = document.createElement('div');
//     item.className = 'chatItem';
//     const when = new Date().toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
//     item.innerHTML = `
//       <div class="avatar"></div>
//       <div>
//         <div class="who">You</div>
//         <div class="text">${text}</div>
//       </div>
//       <div class="when">${when}</div>
//     `;
//     list.appendChild(item);
//     list.scrollTop = list.scrollHeight;
//   }

//   send.addEventListener('click', () => {
//     const text = ta.value.trim();
//     if(!text) return;
//     addMessage(text);
//     ta.value = '';
//     ta.style.height = '44px';
//   });

//   // autosize
//   ta.addEventListener('input', () => {
//     ta.style.height = 'auto';
//     ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
//   });
// })();

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, setDoc, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o",
  authDomain: "street-reads.firebaseapp.com",
  projectId: "street-reads",
  storageBucket: "street-reads.firebasestorage.app",
  messagingSenderId: "228045832951",
  appId: "1:228045832951:web:4b6d868e05a72ab08a89f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


//URL parameter
const params = new URLSearchParams(window.location.search);
const boxId = params.get("libraryId") || "lib_001";

//DOM
const boxName = document.getElementById("boxName");
const boxAddress = document.getElementById("boxAddress");
const reviewsContainer = document.getElementById("reviews");
const reviewerName = document.getElementById("reviewerName");
const reviewText = document.getElementById("reviewText");
const form = document.getElementById("form");
const rateBox = document.getElementById("rateAvg");


//Firestoreのドキュメント参照
let currentBox = null;
let selectedStar = 0;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("Logged in as:", user.displayName || user.email);
  } else {
    console.log("No user logged in");
    currentUser = null;
  }
});


//stars
const stars = document.querySelectorAll(".stars i");
stars.forEach((star, index1) => {
  star.addEventListener("click", () => {
    selectedStar = index1 + 1;
    stars.forEach((star, index2) => {
      index1 >= index2
        ? star.classList.add("active")
        : star.classList.remove("active");
    });
  });
});

//Firestoreからデータを読み込み
function loadBox() {
  const allBoxes = collection(db, "streetLibraries");

  return getDocs(allBoxes)
    .then((boxSnap) => {
      let foundBox = null;

      boxSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id === boxId || data.libraryId === boxId) {
          foundBox = { id: docSnap.id, ...data };
        }
      });

      if (!foundBox) {
        boxName.textContent = "BookBox not found";
        boxAddress.textContent = "No matching address";
        return;
      }

      boxName.textContent = foundBox.name;
      boxAddress.textContent = foundBox.address;
      //既存の loadBox 内でボックスを見つけた後に↓を追加
      currentBoxRef = doc(db, "streetLibraries", foundBox.id);
      initChatListener(currentBoxRef);

      const reviews = foundBox.reviews;
      if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = `<p>No reviews yet, add the first one!</p>`;
        return;
      }

      displayAvgRating(reviews);

      //images
      const imgContainer = document.getElementById("boxImages");
      imgContainer.innerHTML = "";

      const img = foundBox.photoURL;
      console.log("photoURL:", foundBox.photoURL);
      console.log("type:", typeof foundBox.photoURL);

      if (img.length === 0) {
        imgContainer.textContent = "No images yet, add the first one!"
      } else {
        img.forEach(url => {
          const imgs = document.createElement("img");
          imgs.src = url;
          imgs.alt = "BookBox image";
          imgs.className = "box-image";
          imgContainer.appendChild(imgs);
        })
      };

      //review
      reviewsContainer.innerHTML = "";
      reviews.forEach((review) => {
        const div = document.createElement("div");
        div.className = "review";

        const reviewHeader = document.createElement("div");
        reviewHeader.className = "reviewHeader";
        reviewHeader.innerHTML = `
          <img src="${review.avatarURL || 'https://i.pravatar.cc/50'}" alt="avatar" class="avatar">
        <strong>${review.reviewerName}</strong> <p>rating: ${review.rating}</p>`;

        const reviewText = document.createElement("p");
        reviewText.textContent = review.reviewText;

        div.append(reviewHeader, reviewText);
        reviewsContainer.appendChild(div);
      });
    })
    .catch((err) => {
      console.error("Cannot fetch box:", err);
      boxName.textContent = "Error fetching box";
      boxAddress.textContent = "";
    });
}

loadBox();

//calculate average rating
function displayAvgRating(reviews) {
  if (!reviews || reviews.length === 0) {
    document.getElementById("rateAvg").innerHTML = "<p>No rating yet</p>";
    return;
  }

  const ratings = reviews.map(review => Number(review.rating) || 0);
  console.log("ratings:", ratings);

  //average
  let sum = 0;
  for (let i = 0; i < ratings.length; i++) {
    sum = sum + ratings[i];
  }
  let avg = sum / ratings.length;
  avg = avg.toFixed(1);

  let starsHTML = "";
  const totalStars = 5;

  for (let i = 0; i < totalStars; i++) {
    if (i < Math.floor(avg)) {
      starsHTML += `<i class="fa-solid fa-star"></i>`;
    }
    else if (i === Math.floor(avg)) {
      const halfStar = avg - Math.floor(avg);
      if (halfStar >= 0.75) {
        starsHTML += `<i class="fa-solid fa-star"></i>`;
      } else if (halfStar >= 0.25) {
        starsHTML += `<i class="fa-solid fa-star-half-stroke"></i>`;
      } else {
        starsHTML += `<i class="fa-regular fa-star"></i>`; //空
      }
    }
    else {
      starsHTML += `<i class="fa-regular fa-star"></i>`;
    }
  }

  console.log("average:", avg);

  const reviewCount = reviews.length;
  rateBox.innerHTML = `
  ${starsHTML} <span>${avg}</span>
  <p> ${reviewCount} reviews</p>
  `;
}

//レビュー送信
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = reviewerName.value;
  const text = reviewText.value;

  const newReview = {
    avatarURL: currentUser?.photoURL || "https://i.pravatar.cc/60",
    reviewerName: name,
    reviewText: text,
    rating: Number(selectedStar),
    createdAt: new Date()
  };

  updateDoc(currentBox, {
    reviews: arrayUnion(newReview)
  })
    .then(() => {
      alert("Your review was submitted successfully!");
      form.reset();
      selectedStar = 0;
      stars.forEach((star) => star.classList.remove("active"));
      loadBox();
    })
    .catch((error) => {
      console.error("Error adding review:", error);
      alert("Failed to add review.");
    });
});

//add fav
//test
const userId = "user_002";
const userRef = doc(db, "users", userId);

// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     const userId = user.uid; 
//     const userRef = doc(db, "users", userId);

//     initFavorites(userRef);
//   } else {
//     console.log("User not logged in");
//   }
// });

//DOM
const favButton = document.getElementById("favButton");
const favIcon = document.getElementById("favIcon");
const favText = document.getElementById("favText");

//check fav status
const checkFavStatus = () => {
  getDoc(userRef).then((snap) => {
    if (!snap.exists()) return;

    const data = snap.data();
    const favorites = data.favorites || [];
    const isFav = favorites.includes(boxId);
    updateFavUI(isFav);
  });
};

//update UI
const updateFavUI = (isFav) => {
  if (isFav) {
    favIcon.classList.replace("fa-regular", "fa-solid");
    favIcon.style.color = "#4747D0";
    favText.textContent = "Added to Favorites";
    favText.style.color = "#4747D0";
  } else {
    favIcon.classList.replace("fa-solid", "fa-regular");
    favIcon.style.color = "";
    favText.textContent = "Add to Favorites";
    favText.style.color = "";
  }
};

//toggle
const toggleFav = () => {
  getDoc(userRef)
    .then((snap) => {
      if (!snap.exists()) {
        console.error("User not found");
        return;
      }

      const data = snap.data();
      const favorites = data.favorites || [];
      const isFav = favorites.includes(boxId);

      if (isFav) {
        // 削除
        updateDoc(userRef, {
          favorites: arrayRemove(boxId)
        })
          .then(() => {
            console.log("Removed from favorites");
            updateFavUI(false);
          });
      } else {
        // 追加
        updateDoc(userRef, {
          favorites: arrayUnion(boxId)
        })
          .then(() => {
            console.log("Added to favorites");
            updateFavUI(true);
          });
      }
    });
};



//初期化処理
getDoc(userRef)
  .then((snap) => {
    if (!snap.exists()) {
      return setDoc(userRef, { favorites: [] });
    }
  })
  .then(() => {
    console.log("User doc ready");
    checkFavStatus();

    if (favButton) {
      favButton.addEventListener("click", toggleFav);
    }
  })
  .catch((err) => console.error("Error initializing favorites:", err));



//modal
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn-close");

//close modal function
const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

//close the modal when the close button and overlay is clicked
closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

//close modal when the Esc key is pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

//open modal function
const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};
//open modal event
openModalBtn.addEventListener("click", openModal);




//chat
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const attachImg = document.getElementById("attachImg");

//Firestoreドキュメント参照をグローバルに
let currentBoxRef = null;

function initChatListener(boxRef) {
  onSnapshot(boxRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const comments = data.comments || [];
      renderMessages(comments);
    } else {
      console.log("Document not found");
    }
  });
}

function renderMessages(comments) {
  messages.innerHTML = "";
  comments.forEach((msg) => {
    const when = msg.createdAt?.toDate
      ? msg.createdAt.toDate().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
      : "";


    //attach img（あれば表示）
    const imageSection = msg.commentImg
      ? `
        <div class="sentImage">
            <img src="${msg.commentImg}" alt="attached image">
        </div>
        `
      : "";

    const item = document.createElement("div");
    item.className = "chatItem";
    item.innerHTML = `
      <div class="perUser">
        <div class="userInfo">
          <div class="who">${msg.userId || "Anonymous"}</div>
          <div class="when">${when}</div>
        </div>
        <div class="text">${msg.commentText || ""}</div>
        <img>${imageSection}
      </div>
    `;
    messages.appendChild(item);
  });

  messages.scrollTop = messages.scrollHeight;
}

//send msg
sendBtn.addEventListener("click", async () => {
  const text = chatInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to send a message.");
    return;
  }

  const newComment = {
    commentText: text,
    commentImg: user.photoURL || "https://i.pravatar.cc/50",
    createdAt: new Date(),
    parentCommentId: "",
    userId: user.displayName || "Anonymous",
  };

  if (!currentBoxRef) {
    console.error("No currentBox reference yet.");
    return;
  }

  await updateDoc(currentBoxRef, {
    comments: arrayUnion(newComment),
  })
    .then(() => {
      chatInput.value = "";
    })
    .catch((err) => console.error("Error adding comment:", err));
});

// Enterキー送信
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

attachImg.addEventListener("click", () => {
});
