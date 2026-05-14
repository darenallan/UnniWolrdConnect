require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
const db = require("../firebase");

async function upgradeUser() {
  try {
    const userId = 'xoIjHFDipAoYLIGBMmxN'; // Test 1
    await db.collection("users").doc(userId).update({ 
        role: 'mentor',
        isMentor: true 
    });
    console.log(`User Test 1 (${userId}) updated to mentor role successfully.`);
  } catch (error) {
    console.error("Error upgrading user:", error);
  }
}

upgradeUser();
