// // fetch("../data/bookBoxData.json")
// //   .then(res => res.json())
// //   .then(data => {
// //     const box = data.find(b => b.id === boxId);
// //     if (!box) {
// //       document.getElementById("box-name").textContent = "BookBox not found";
// //       return;
// //     }

// // Images
// // const imgContainer = document.getElementById("boxImages");
// // box.img.forEach(src => {
// //     const img = document.createElement("img");
// //     img.src = src;
// //     imgContainer.appendChild(img);
// // });

// // Rate
// // const rateContainer = document.getElementById("rateAvg");

// // const reviewDiv = document.createElement("div");
// // reviewDiv.classList.add("rate");

// // const rateDiv = document.createElement("div");
// // rateContainer.appendChild(rateDiv);

// // box.reviews.forEach(user => {
// //   const reviewDiv = document.createElement("div");
// //   reviewDiv.classList.add("review");
// //   reviewDiv.innerHTML = `
// //         <img src="${user.picture}">
// //         <strong>${user.name}</strong><br>
// //         <p>${user.comment}</p>
// //         `;
// //   reviewsContainer.appendChild(reviewDiv);
// // });
// // })
// // .catch (err => console.error("Error loading JSON:", err));


// function loadBox() {
//   //streetLibraries コレクションを全部取得
//   const allBoxes = collection(db, "streetLibraries");

//   getDocs(allBoxes)
//     .then((boxSnap) => {
//       let foundBox = null;

//       //libraryId が一致するものを探す
//       boxSnap.forEach((docSnap) => {
//         const data = docSnap.data();
//         if (data.libraryId === boxId) {
//           foundBox = { id: docSnap.id, ...data };
//         }
//       });

//       if (!foundBox) {
//         boxName.textContent = "BookBox not found";
//         boxAddress.textContent = "cannot find";
//         return;
//       }

//       //一致した box の情報を表示
//       boxName.textContent = foundBox.name;
//       boxAddress.textContent = foundBox.address;
//       currentBox = doc(db, "streetLibraries", foundBox.id);

//       //レビュー取得
//       const reviews = foundBox.reviews;

//       if (!reviews || reviews.length === 0) {
//         reviewsContainer.innerHTML = `<p> No reviews yet, add first one! </p>`;
//         return;
//       }

//       reviewsContainer.innerHTML = "";
//       reviews.forEach((review) => {
//         const div = document.createElement("div");
//         div.classList.add("review");
//         div.innerHTML = `
//           <div class="reviewHeader">
//             <strong>${review.reviewerName}</strong>
//           </div>
//           <p>${review.reviewText}</p>
//         `;
//         reviewsContainer.appendChild(div);
//       });
//     }).catch((err) => {
//       console.error("Cannot fetch box:", err);
//       boxName.textContent = "Error fetching box";
//       boxAddress.textContent = "";
//     });

//   // const reviewsCheck = collection(db, "streetLibraries");
//   // getDocs(reviewsCheck).then((reviewSnap) => {
//   //   if (reviewSnap.empty) {
//   //     reviewsContainer.innerHTML = "<p>No reviews yet. Add first one!</p>";
//   //     return;
//   //   }

//   //   reviewsContainer.innerHTML = "";
//   //   reviewSnap.forEach((reviewDoc) => {
//   //     const review = reviewDoc.data();
//   //     const div = document.createElement("div");
//   //     div.classList.add("review");
//   //     div.innerHTML = `
//   //       <div class="reviewHeader">
//   //         <strong>${review.reviewerName}</strong>
//   //       </div>
//   //       <p>${review.review}</p>
//   //     `;
//   //     reviewsContainer.appendChild(div);
//   //   });
//   // }).catch((err) => {
//   //   console.error("Error loading reviews:", err);
//   //   reviewsContainer.innerHTML = "<p>Failed to load reviews.</p>";
//   // });

//   // }).catch((err) => {
//   //   console.error("Cannot fetch box:", err);
//   //   boxName.textContent = "Error fetching box";
//   //   boxAddress.textContent = "";
//   // });
// }

// loadBox();

// //get reviews, ratings from reviewsContainer
// form.addEventListener("submit", (event) => {
//   event.preventDefault();

//   const name = reviewerName.value.trim();
//   const text = reviewText.value.trim();

//   const newReview = {
//     reviewerName: name,
//     reviewText: text,
//     rating: rate,
//     createdAt: new Date()
//   };

//   updateDoc(currentBox, {
//     reviews: arrayUnion(newReview)
//   })
//     .then(() => {
//       alert("Your review sent successfully!");
//       form.reset();
//       selectedStar = 0;
//       stars.forEach((star) => star.classList.remove("active"));
//       loadBox();
//     })
//     .catch((error) => {
//       console.error("Error adding review:", error);
//       alert("Failed to add review.");
//     });


// //modal
// const modal = document.querySelector(".modal");
// const overlay = document.querySelector(".overlay");
// const openModalBtn = document.querySelector(".btn-open");
// const closeModalBtn = document.querySelector(".btn-close");

// //close modal function
// const closeModal = function () {
//   modal.classList.add("hidden");
//   overlay.classList.add("hidden");
// };

// //close the modal when the close button and overlay is clicked
// closeModalBtn.addEventListener("click", closeModal);
// overlay.addEventListener("click", closeModal);

// //close modal when the Esc key is pressed
// document.addEventListener("keydown", function (e) {
//   if (e.key === "Escape" && !modal.classList.contains("hidden")) {
//     closeModal();
//   }
// });

// //open modal function
// const openModal = function () {
//   modal.classList.remove("hidden");
//   overlay.classList.remove("hidden");
// };
// //open modal event
// openModalBtn.addEventListener("click", openModal);

// let selectedStar = 0;
// const stars = document.querySelectorAll('.stars i');
// stars.forEach((star, index1) => {
//   star.addEventListener("click", () => {
//     selectedStar = index1 + 1;

//     stars.forEach((star, index2) => {
//       index1 >= index2
//         ? star.classList.add("active")
//         : star.classList.remove("active");
//     });
//   });
// });


import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

//Firebase設定
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

  getDocs(allBoxes)
    .then((boxSnap) => {
      let foundBox = null;

      boxSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.libraryId === boxId) {
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
      currentBox = doc(db, "streetLibraries", foundBox.id);

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
        reviewHeader.innerHTML = `<strong>${review.reviewerName}</strong> <p>rating: ${review.rating}</p>`;

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
    } else if (i === Math.floor(avg) && avg - Math.floor(avg) >= 0.5) {
      starsHTML += `<i class="fa-regular fa-star-half-stroke"></i>`;
    } else {
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
