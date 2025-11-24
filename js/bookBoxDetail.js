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
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


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
const storage = getStorage(app);


//URL parameter - support both "id" and "libraryId" for backwards compatibility
const params = new URLSearchParams(window.location.search);
const boxId = params.get("id") || params.get("libraryId") || null;

//DOM
const boxName = document.getElementById("boxName");
const boxAddress = document.getElementById("boxAddress");
const addBoxPicBtn = document.getElementById("addBoxPicBtn");
const boxPicInput = document.getElementById("boxPicInput");
const reviewsContainer = document.getElementById("reviewsContainer");
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
  if (!boxId) {
    boxName.textContent = "BookBox ID not provided";
    boxAddress.textContent = "Please provide a valid BookBox ID";
    return Promise.resolve();
  }

  // Try to get document directly by ID first (faster)
  const boxDocRef = doc(db, "streetLibraries", boxId);

  return getDoc(boxDocRef)
    .then((docSnap) => {
      let foundBox = null;

      if (docSnap.exists()) {
        // Found by direct ID
        foundBox = { id: docSnap.id, ...docSnap.data() };
      } else {
        // Fallback: search all boxes by libraryId (for backwards compatibility)
        return getDocs(collection(db, "streetLibraries"))
          .then((boxSnap) => {
            let found = null;
            boxSnap.forEach((docSnap) => {
              const data = docSnap.data();
              if (docSnap.id === boxId || data.libraryId === boxId) {
                found = { id: docSnap.id, ...data };
              }
            });
            return found;
          });
      }

      return foundBox;
    })
    .then((foundBox) => {
      if (!foundBox) {
        boxName.textContent = "BookBox not found";
        boxAddress.textContent = "No matching address";
        return;
      }

      boxName.textContent = foundBox.name || 'Unnamed BookBox';
      boxAddress.textContent = foundBox.address || 'Address not available';

      //既存の loadBox 内でボックスを見つけた後に↓を追加
      currentBoxRef = doc(db, "streetLibraries", foundBox.id);
      currentBox = currentBoxRef; // Set for review submission
      initChatListener(currentBoxRef);

      const reviews = foundBox.reviews || [];
      if (reviews.length === 0 && reviewsContainer) {
        const p = document.createElement("p");
        p.textContent = "No reviews yet, add the first one!";
        reviewsContainer.appendChild(p);
      }


      // console.log("reviewsContainer:", reviewsContainer);


      else {
        displayAvgRating(reviews);
      }

      //images - improved handling
      const imgContainer = document.getElementById("boxImages");
      if (imgContainer) {
        imgContainer.innerHTML = "";

        let photoURLs = Array.isArray(foundBox.photoURL) ? foundBox.photoURL : [];

        const totalSlots = 11;
        for (let i = 0; i < totalSlots; i++) {
          const img = document.createElement("img");
          if (photoURLs[i]) {
            // ユーザーがアップロードした画像があれば表示
            img.src = photoURLs[i];
            img.alt = `BookBox image ${i + 1}`;
          } else {
            img.src = "../images/placeholder_img.png";
            img.alt = "Placeholder image";
            img.classList.add("placeholder");
          }
          img.className = "box-image";
          img.style.cursor = "pointer";
          imgContainer.appendChild(img);
        }
      }


      function enableMobilePopup() {
        const isMobile = window.innerWidth <= 768;
        const popup = document.getElementById("imagePopup");
        const popupImg = document.getElementById("popupImg");
        const closeBtn = document.querySelector("#imagePopup .close");
        const images = document.querySelectorAll("#boxImages img");

        if (!popup || !popupImg || !closeBtn || images.length === 0) return;

        images.forEach(img => img.onclick = null);

        if (!isMobile) {
          popup.style.display = "none";
          return;
        }

        images.forEach(img => {
          img.onclick = () => {
            popupImg.src = img.src;
            popup.style.display = "flex";
          };
        });

        closeBtn.onclick = () => {
          popup.style.display = "none";
        };
      }

      window.addEventListener("load", enableMobilePopup);
      window.addEventListener("resize", enableMobilePopup);


      //review
      if (reviewsContainer) {
        reviewsContainer.innerHTML = "";
        if (reviews && reviews.length > 0) {
          // Use async function to fetch avatars for reviews
          const renderReview = async (review) => {
            const div = document.createElement("div");
            div.className = "review";

            // Fetch actual profile picture from Firestore
            const reviewAvatar = review.userId ? await getUserAvatar(review.userId) : "../src/avatar.png";

            const reviewHeader = document.createElement("div");
            reviewHeader.className = "reviewHeader";
            const reviewText = document.createElement("p");
            // reviewText.textContent = review.reviewText;
            reviewHeader.innerHTML = `
              <div class="reviewItem">
                  <img src="${reviewAvatar}" alt="avatar" class="avatar">
                  <div class="reviewContent">
                    <div class="reviewHeader">
                      <strong>${review.reviewerName || "Anonymous"}</strong>
                      <span class="rating"><i class="fa-solid fa-star" style="color:#4747D0"></i> ${review.rating || 0}</span>
                    </div>
                    <p class="reviewText">${review.reviewText || ""}</p>
                  </div>
              </div>`;

            div.append(reviewHeader, reviewText);
            reviewsContainer.appendChild(div);
          };

          // Render all reviews asynchronously
          Promise.all(reviews.map(review => renderReview(review))).catch(err => {
            console.error("Error rendering reviews:", err);
          });
        }
      }
    })
    .catch((err) => {
      console.error("Cannot fetch box:", err);
      boxName.textContent = "Error fetching box";
      boxAddress.textContent = "";
    });
}

loadBox();

//add box pic
addBoxPicBtn.addEventListener("click", () => boxPicInput.click());

boxPicInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length || !currentUser) {
    alert("upload after you login");
    return;
  }

  try {
    const urls = await uploadBookBoxImages(files, currentBoxRef.id);

    await updateDoc(currentBoxRef, {
      photoURL: arrayUnion(...urls)
    });

    alert("success uploading your image!");
    // ボックス詳細ページが別ファイルなら、そこに reload 通知を送る
    window.dispatchEvent(new CustomEvent("boxImagesUpdated"));
  } catch (err) {
    console.error(err);
    alert("Failed uploading your image...");
  }
});

window.addEventListener("boxImagesUpdated", () => {
  loadBox(); // ← 画像一覧を再取得する関数
});



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

  let starsHTML = '<div class="rateStars">';
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

  starsHTML += '</div>';

  const reviewCount = reviews.length;
  rateBox.innerHTML = `
  <div class="starsAvg">${starsHTML}</div>
  <div class="rating-info">
    <span class="avg">${avg}</span>
    <p>${reviewCount} reviews</p>
  </div>
`;

}

async function updateAverageRating(boxRef) {
  const boxSnap = await getDoc(boxRef);
  if (!boxSnap.exists()) return;

  const data = boxSnap.data();
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  // 数値として有効な rating だけ抽出
  const validRatings = reviews
    .map(r => typeof r.rating === "string" ? parseFloat(r.rating) : r.rating)
    .filter(r => typeof r === "number" && !isNaN(r));

  const avg = validRatings.length > 0
    ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
    : null;

  await updateDoc(boxRef, { averageRating: avg });
  console.log(`✅ Updated averageRating for ${boxRef.id}: ${avg}`);
}

//レビュー送信
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = reviewerName.value;
  const text = reviewText.value;

  // Fetch latest profile picture from Firestore
  let avatarURL = currentUser?.photoURL || "https://i.pravatar.cc/60";
  if (currentUser) {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.photoURL) {
          avatarURL = userData.photoURL;
        }
      }
    } catch (err) {
      console.error('Error fetching user photo:', err);
    }
  }

  const newReview = {
    avatarURL: avatarURL,
    reviewerName: name,
    reviewText: text,
    rating: Number(selectedStar),
    createdAt: new Date(),
    userId: currentUser.uid,
  };

  updateDoc(currentBox, {
    reviews: arrayUnion(newReview)
  })
    .then(async () => {
      await updateAverageRating(currentBox);

      // Update navbar avatar with latest profile picture
      const navbar = document.querySelector('app-navbar');
      if (navbar && navbar.updateAvatar && currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.photoURL) {
              navbar.updateAvatar(userData.photoURL);
            }
          }
        } catch (err) {
          console.error('Error updating navbar avatar:', err);
        }
      }

      alert("Your review was submitted successfully!");
      form.reset();
      selectedStar = 0;
      stars.forEach((star) => star.classList.remove("active"));
      loadBox();
      closeModal();
    })
    .catch((error) => {
      console.error("Error adding review:", error);
      alert("Failed to add review.");
    });
});

//add fav
const favButton = document.getElementById("favButton");
const favIcon = document.getElementById("favIcon");
const favText = document.getElementById("favText");

let userRef = null;

//UI 
function updateFavUI(isFav) {
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
}

//状態確認
async function checkFavStatus() {
  if (!userRef || !boxId) return;
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const favorites = snap.data().favorites || [];
  const isFav = favorites.includes(boxId);
  updateFavUI(isFav);
}

//クリックで追加/削除
async function toggleFav() {
  if (!userRef || !boxId) return;
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const favorites = snap.data().favorites || [];
  const isFav = favorites.includes(boxId);

  if (isFav) {
    await updateDoc(userRef, { favorites: arrayRemove(boxId) });
    updateFavUI(false);
    console.log("Removed from favorites");
  } else {
    await updateDoc(userRef, { favorites: arrayUnion(boxId) });
    updateFavUI(true);
    console.log("Added to favorites");
  }
}

//ログイン監視で初期化
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in as:", user.uid);
    userRef = doc(db, "users", user.uid);

    // user ドキュメントがなければ作成
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, { favorites: [] });
    }

    await checkFavStatus();

    if (favButton) {
      favButton.disabled = false;
      favButton.addEventListener("click", toggleFav);
    }
  } else {
    console.log("User not logged in - disabling fav button");
    userRef = null;
    if (favButton) {
      favButton.disabled = true;
      favText.textContent = "Log in to add favorites";
      favIcon.classList.replace("fa-solid", "fa-regular");
      favIcon.style.color = "";
    }
  }
});




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
chatInput.placeholder = "Leave a comment";
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const attachInput = document.getElementById("attachInput");

//Firestoreドキュメント参照をグローバルに
let currentBoxRef = null;

// function initChatListener(boxRef) {
//   onSnapshot(boxRef, (snap) => {
//     if (snap.exists()) {
//       const data = snap.data();
//       const comments = data.comments || [];
//       renderMessages(comments);
//     } else {
//       console.log("Document not found");
//     }
//   });
// }

//chat
// function renderMessages(comments) {
//   console.log(comments);

//   messages.innerHTML = "";

//   comments.forEach((msg) => {
//     const when = msg.createdAt?.toDate
//       ? msg.createdAt.toDate().toLocaleString([], {
//         month: "short",
//         day: "numeric",
//         hour: "numeric",
//         minute: "2-digit",
//       })
//       : "";

// const userAvatar = msg.avatarURL || "https://i.pravatar.cc/50";
// const imageSection = msg.commentImg 
//   ? `<div class="sentImage"><img src="${msg.commentImg}" alt="attached image"></div>` 
//   : "";



//     const item = document.createElement("div");
//     item.className = "chatItem";
//     item.innerHTML = `
//       <div class="commentItem">
//         <img src="${userAvatar}" alt="avatar" class="avatar">
//         <div class="perUser">
//           <div class="userInfo">
//             <div class="who">${msg.userId || "Anonymous"}</div>
//             <div class="when">${when}</div>
//           </div>
//           <div class="text">${msg.commentText || ""}</div>
//           ${imageSection}
//         </div>
//       </div>
//     `;
//     messages.appendChild(item);
//   });

//   messages.scrollTop = messages.scrollHeight;
// }


//send msg
//cache
const userCache = {};
const avatarCache = {};

// UID から displayName を取得
async function getUserName(uid) {
  if (!uid) return "Anonymous";
  if (userCache[uid]) return userCache[uid];

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const name = userDoc.data().displayName || "No name";
      userCache[uid] = name;
      return name;
    } else {
      return "Anonymous";
    }
  } catch (err) {
    console.error("Error fetching user name:", err);
    return "Anonymous";
  }
}

// Fetch user's actual profile picture from Firestore
async function getUserAvatar(uid) {
  if (!uid) return "../src/avatar.png";
  if (avatarCache[uid]) return avatarCache[uid];

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const photoURL = userData.photoURL;

      // Only use valid photoURLs (not placeholder/random images)
      if (photoURL &&
        photoURL.trim() !== '' &&
        (photoURL.startsWith('http://') || photoURL.startsWith('https://')) &&
        !photoURL.includes('pravatar.cc') &&
        !photoURL.includes('i.pravatar.cc')) {
        avatarCache[uid] = photoURL;
        return photoURL;
      }
    }
    // Return default avatar if no valid photoURL
    avatarCache[uid] = "../src/avatar.png";
    return "../src/avatar.png";
  } catch (err) {
    console.error("Error fetching user avatar:", err);
    avatarCache[uid] = "../src/avatar.png";
    return "../src/avatar.png";
  }
}

//display msg
async function renderMessages(comments) {
  messages.innerHTML = "";

  for (const msg of comments) {
    const when = msg.createdAt?.toDate
      ? msg.createdAt.toDate().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
      : "";

    // Fetch actual profile picture from Firestore instead of using stored avatarURL
    const userAvatar = await getUserAvatar(msg.userId);
    // Support both commentImg and imageUrl field names
    const imageUrl = msg.commentImg || msg.imageUrl || null;
    const imageSection = imageUrl
      ? `<div class="sentImage"><img src="${imageUrl}" alt="attached image" style="max-width: 300px; border-radius: 8px; margin-top: 8px;"></div>`
      : "";

    const userName = await getUserName(msg.userId);

    const item = document.createElement("div");
    item.className = "chatItem";
    item.innerHTML = `
      <div class="commentItem">
        <img src="${userAvatar}" alt="avatar" class="avatar">
        <div class="perUser">
          <div class="userInfo">
            <div class="who">${userName}</div>
            <div class="when">${when}</div>
          </div>
          <div class="text">${msg.commentText || ""}</div>
          ${imageSection}
        </div>
      </div>
    `;
    messages.appendChild(item);
  }

  messages.scrollTop = messages.scrollHeight;
}

//chat listener
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

//send message
sendBtn.addEventListener("click", async () => {
  const text = chatInput.value.trim();
  const imageFile = attachInput?.files[0];

  // Need either text or image
  if (!text && !imageFile) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to send a message.");
    return;
  }

  if (!currentBoxRef) {
    console.error("No currentBox reference yet.");
    return;
  }

  try {
    // Fetch latest profile picture from Firestore
    let avatarURL = user.photoURL || "https://i.pravatar.cc/60";
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.photoURL) {
          avatarURL = userData.photoURL;
        }
      }
    } catch (err) {
      console.error('Error fetching user photo:', err);
    }

    let imageUrl = null;

    // Upload image if attached
    if (imageFile) {
      try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        imageUrl = await window.uploadImage(imageFile, `chat/${currentBoxRef.id}`);
        console.log("Chat image uploaded:", imageUrl);
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        alert("Failed to upload image: " + uploadError.message);
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        return;
      }
    }

    // Create comment with text and/or image
    const newComment = {
      commentText: text || "",
      commentImg: imageUrl || null,
      createdAt: new Date(),
      userId: user.uid,
      avatarURL: avatarURL,
    };

    await updateDoc(currentBoxRef, {
      comments: arrayUnion(newComment),
    });

    // Update navbar avatar with latest profile picture
    const navbar = document.querySelector('app-navbar');
    if (navbar && navbar.updateAvatar && user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.photoURL) {
            navbar.updateAvatar(userData.photoURL);
          }
        }
      } catch (err) {
        console.error('Error updating navbar avatar:', err);
      }
    }

    // Clear inputs
    chatInput.value = "";
    if (attachInput) attachInput.value = "";

    // Reset button
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
  } catch (err) {
    console.error("Error adding comment:", err);
    alert("Failed to send message: " + err.message);
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
  }
});

// Enterキーで送信
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

//attach image button
if (attachBtn && attachInput) {
  attachBtn.addEventListener("click", () => attachInput.click());

  // Handle image attachment
  attachInput.addEventListener("change", async (e) => {
    const file = attachInput.files[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to send an image.");
      return;
    }

    if (!currentBoxRef) {
      console.error("No currentBox reference yet.");
      return;
    }

    try {
      // Fetch latest profile picture from Firestore
      let avatarURL = user.photoURL || "https://i.pravatar.cc/60";
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.photoURL) {
            avatarURL = userData.photoURL;
          }
        }
      } catch (err) {
        console.error('Error fetching user photo:', err);
      }

      // Show loading state
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      // Upload image to Cloudinary
      const imageUrl = await window.uploadImage(file, `chat/${currentBoxRef.id}`);
      console.log("Chat image uploaded:", imageUrl);

      // Create comment with image
      const imageComment = {
        commentText: "",
        commentImg: imageUrl,
        createdAt: new Date(),
        userId: user.uid,
        avatarURL: avatarURL,
      };

      // Save to Firestore
      await updateDoc(currentBoxRef, {
        comments: arrayUnion(imageComment),
      });

      // Update navbar avatar with latest profile picture
      const navbar = document.querySelector('app-navbar');
      if (navbar && navbar.updateAvatar && user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.photoURL) {
              navbar.updateAvatar(userData.photoURL);
            }
          }
        } catch (err) {
          console.error('Error updating navbar avatar:', err);
        }
      }

      console.log("Image sent:", imageUrl);

      // Clear input
      attachInput.value = "";
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to send image: " + err.message);
    } finally {
      // Reset button
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    }
  });
}



