
// import firebaseConfig from "./firebase.js";

// async function fetchUsers() {
//   const colRefUser = collection(db, "users");
//   const snapshotUsers = await getDoc(colRefUser);
//   return snapshotUsers.docs.map(doc => ({ id: doc.id, ...doc.data()
//   }));
// }

// async function fetchLibraries() {
//   const colRefLibrary = collection(db, "streetLibraries");
//   const snapshotLibraries = await getDoc(colRefLibrary);
//   return snapshotLibraries.docs.map(doc => ({ id: doc.id, ...doc.data()
//   }));
// }

// async function fetchAllData() {
//   try {
//     const [users, libraries] = await Promise.all([
//       fetchUsers(),
//       fetchLibraries()
//     ]);

//     console.log(users);
//     console.log(libraries);
//   } catch (error) {
//     console.error("error")
//   }
// }

// fetchAllData();

const eye = document.querySelector(".fa-eye");
const slashEye = document.querySelector(".fa-eye-slash");
const password = document.querySelector("#password");

slashEye.style.display = "none";
const originalText = password.textContent;
password.textContent = "*".repeat(originalText.length);

eye.addEventListener("click", () => {
   eye.style.display = "none";
   slashEye.style.display = "inline";
   password.textContent = originalText;
});

slashEye.addEventListener("click", () => {
  eye.style.display = "inline";
  slashEye.style.display = "none";
  password.textContent = "*".repeat(originalText.length);
});
