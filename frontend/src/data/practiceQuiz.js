// AUTO-GENERATED – ISL PRACTICE QUIZ
// Video-based MCQ practice
// 10 questions per category
// Drop-in ready

function qid(categoryKey, index) {
  return `${categoryKey}--q${index + 1}`;
}

export const practiceQuizCategories = [
  // -------------------------
  // DAY TO DAY NEEDS
  // -------------------------
  {
    key: "day-to-day-needs",
    title: "Day to Day Needs",
    questions: [
      { id: qid("day-to-day-needs", 0), videoKey: "hello", question: "What is being signed?", options: ["Hello", "Thank you", "Sorry", "Goodbye"], correctIndex: 0 },
      { id: qid("day-to-day-needs", 1), videoKey: "thank_you", question: "Choose the correct meaning.", options: ["Please", "Thank you", "Help", "Wait"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 2), videoKey: "sorry", question: "What does this sign express?", options: ["Excuse me", "Sorry", "No", "Stop"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 3), videoKey: "please", question: "Identify the sign.", options: ["Sorry", "Please", "Welcome", "Hello"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 4), videoKey: "help", question: "What is being signed?", options: ["Help", "Come", "Go", "Call"], correctIndex: 0 },
      { id: qid("day-to-day-needs", 5), videoKey: "wait", question: "Select the correct meaning.", options: ["Stop", "Wait", "Sit", "Stand"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 6), videoKey: "call", question: "What action is shown?", options: ["Message", "Call", "Meet", "Wait"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 7), videoKey: "come", question: "Identify the action.", options: ["Go", "Come", "Stop", "Leave"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 8), videoKey: "go", question: "What does the sign indicate?", options: ["Come", "Go", "Sit", "Run"], correctIndex: 1 },
      { id: qid("day-to-day-needs", 9), videoKey: "goodbye", question: "Choose the correct meaning.", options: ["Hello", "Welcome", "Goodbye", "Sorry"], correctIndex: 2 },
    ],
  },

  // -------------------------
  // PEOPLE & IDENTITY
  // -------------------------
  {
    key: "people-identity",
    title: "People & Identity",
    questions: [
      { id: qid("people-identity", 0), videoKey: "myself", question: "What does this sign mean?", options: ["You", "Myself", "Friend", "Family"], correctIndex: 1 },
      { id: qid("people-identity", 1), videoKey: "friend", question: "Identify the sign.", options: ["Teacher", "Friend", "Brother", "Parent"], correctIndex: 1 },
      { id: qid("people-identity", 2), videoKey: "family", question: "What is being signed?", options: ["Group", "Family", "Friends", "People"], correctIndex: 1 },
      { id: qid("people-identity", 3), videoKey: "brother", question: "Select the correct answer.", options: ["Father", "Brother", "Uncle", "Son"], correctIndex: 1 },
      { id: qid("people-identity", 4), videoKey: "sister", question: "Identify the sign.", options: ["Mother", "Sister", "Aunt", "Daughter"], correctIndex: 1 },
      { id: qid("people-identity", 5), videoKey: "mother", question: "What relation is shown?", options: ["Sister", "Mother", "Friend", "Teacher"], correctIndex: 1 },
      { id: qid("people-identity", 6), videoKey: "father", question: "Choose the correct meaning.", options: ["Uncle", "Father", "Brother", "Grandfather"], correctIndex: 1 },
      { id: qid("people-identity", 7), videoKey: "proud", question: "What feeling is expressed?", options: ["Sad", "Angry", "Proud", "Scared"], correctIndex: 2 },
      { id: qid("people-identity", 8), videoKey: "confident", question: "Identify the emotion.", options: ["Nervous", "Confident", "Tired", "Sad"], correctIndex: 1 },
      { id: qid("people-identity", 9), videoKey: "belong", question: "What does this sign show?", options: ["Leave", "Belong", "Follow", "Join"], correctIndex: 1 },
    ],
  },

  // -------------------------
  // HOME & LIVING
  // -------------------------
  {
    key: "home-living",
    title: "Home & Living",
    questions: [
      { id: qid("home-living", 0), videoKey: "open_door", question: "What action is shown?", options: ["Close door", "Open door", "Lock door", "Knock"], correctIndex: 1 },
      { id: qid("home-living", 1), videoKey: "close_door", question: "Identify the action.", options: ["Open door", "Close door", "Lock door", "Push"], correctIndex: 1 },
      { id: qid("home-living", 2), videoKey: "clean_house", question: "What is being signed?", options: ["Cook", "Clean house", "Wash clothes", "Sweep"], correctIndex: 1 },
      { id: qid("home-living", 3), videoKey: "cook", question: "Choose the correct meaning.", options: ["Eat", "Cook", "Serve", "Clean"], correctIndex: 1 },
      { id: qid("home-living", 4), videoKey: "wash_clothes", question: "What action is shown?", options: ["Wash clothes", "Dry clothes", "Fold clothes", "Wear clothes"], correctIndex: 0 },
      { id: qid("home-living", 5), videoKey: "switch_on", question: "Identify the action.", options: ["Switch off", "Switch on", "Plug", "Unplug"], correctIndex: 1 },
      { id: qid("home-living", 6), videoKey: "lock", question: "What does this sign indicate?", options: ["Open", "Lock", "Close", "Break"], correctIndex: 1 },
      { id: qid("home-living", 7), videoKey: "sit", question: "What action is shown?", options: ["Stand", "Sit", "Sleep", "Lie down"], correctIndex: 1 },
      { id: qid("home-living", 8), videoKey: "sleep", question: "Choose the correct meaning.", options: ["Rest", "Sleep", "Wake", "Sit"], correctIndex: 1 },
      { id: qid("home-living", 9), videoKey: "relax", question: "What does this sign show?", options: ["Work", "Relax", "Exercise", "Run"], correctIndex: 1 },
    ],
  },

  // -------------------------
  // SCHOOL & LEARNING
  // -------------------------
  {
    key: "school-learning",
    title: "School & Learning",
    questions: [
      { id: qid("school-learning", 0), videoKey: "school", question: "What place is shown?", options: ["Office", "School", "Home", "Market"], correctIndex: 1 },
      { id: qid("school-learning", 1), videoKey: "read", question: "Identify the action.", options: ["Write", "Read", "Speak", "Listen"], correctIndex: 1 },
      { id: qid("school-learning", 2), videoKey: "write", question: "What is being signed?", options: ["Draw", "Write", "Erase", "Read"], correctIndex: 1 },
      { id: qid("school-learning", 3), videoKey: "listen", question: "Choose the correct meaning.", options: ["Talk", "Listen", "Ask", "Read"], correctIndex: 1 },
      { id: qid("school-learning", 4), videoKey: "question", question: "What action is shown?", options: ["Answer", "Question", "Explain", "Teach"], correctIndex: 1 },
      { id: qid("school-learning", 5), videoKey: "study", question: "Identify the sign.", options: ["Play", "Study", "Teach", "Rest"], correctIndex: 1 },
      { id: qid("school-learning", 6), videoKey: "homework", question: "What does this sign mean?", options: ["Exam", "Homework", "Project", "Class"], correctIndex: 1 },
      { id: qid("school-learning", 7), videoKey: "book", question: "What object is shown?", options: ["Notebook", "Book", "Bag", "Paper"], correctIndex: 1 },
      { id: qid("school-learning", 8), videoKey: "learn", question: "Choose the correct meaning.", options: ["Teach", "Learn", "Explain", "Practice"], correctIndex: 1 },
      { id: qid("school-learning", 9), videoKey: "finish", question: "What does this sign indicate?", options: ["Start", "Finish", "Continue", "Pause"], correctIndex: 1 },
    ],
  },

  // -------------------------
  // TRAVEL & DIRECTIONS
  // -------------------------
  {
    key: "travel-directions",
    title: "Travel & Directions",
    questions: [
      { id: qid("travel-directions", 0), videoKey: "go_straight", question: "Which direction is shown?", options: ["Left", "Right", "Straight", "Back"], correctIndex: 2 },
      { id: qid("travel-directions", 1), videoKey: "turn_left", question: "Identify the direction.", options: ["Right", "Left", "Straight", "Stop"], correctIndex: 1 },
      { id: qid("travel-directions", 2), videoKey: "turn_right", question: "What direction is signed?", options: ["Left", "Right", "Back", "Stop"], correctIndex: 1 },
      { id: qid("travel-directions", 3), videoKey: "stop", question: "What action is shown?", options: ["Go", "Wait", "Stop", "Run"], correctIndex: 2 },
      { id: qid("travel-directions", 4), videoKey: "wait", question: "Choose the correct meaning.", options: ["Walk", "Wait", "Turn", "Go"], correctIndex: 1 },
      { id: qid("travel-directions", 5), videoKey: "bus_stop", question: "What place is shown?", options: ["Station", "Bus stop", "Airport", "School"], correctIndex: 1 },
      { id: qid("travel-directions", 6), videoKey: "cross_road", question: "Identify the action.", options: ["Stop", "Cross road", "Turn", "Walk"], correctIndex: 1 },
      { id: qid("travel-directions", 7), videoKey: "follow_me", question: "What does this sign indicate?", options: ["Go alone", "Follow me", "Wait", "Stop"], correctIndex: 1 },
      { id: qid("travel-directions", 8), videoKey: "reach", question: "Choose the correct meaning.", options: ["Start", "Reach", "Leave", "Stop"], correctIndex: 1 },
      { id: qid("travel-directions", 9), videoKey: "safe_travel", question: "What is being expressed?", options: ["Hurry", "Safe travel", "Stop", "Danger"], correctIndex: 1 },
    ],
  },
  {
    key: "shopping-money",
    title: "Shopping & Money",
    questions: [
        { id: qid("shopping-money",0), videoKey: "buy", question: "What action is shown?", options: ["Buy", "Sell", "Return", "Exchange"], correctIndex: 0 },
        { id: qid("shopping-money",1), videoKey: "price", question: "What is being asked?", options: ["Price", "Discount", "Quality", "Bill"], correctIndex: 0 },
        { id: qid("shopping-money",2), videoKey: "pay_cash", question: "Choose the correct meaning.", options: ["Pay cash", "Pay card", "Refund", "Save"], correctIndex: 0 },
        { id: qid("shopping-money",3), videoKey: "pay_card", question: "Identify the action.", options: ["Pay card", "Pay cash", "Save money", "Borrow"], correctIndex: 0 },
        { id: qid("shopping-money",4), videoKey: "discount", question: "What does this sign indicate?", options: ["Discount", "Bill", "Cost", "Refund"], correctIndex: 0 },
        { id: qid("shopping-money",5), videoKey: "bill", question: "What is being requested?", options: ["Bill", "Refund", "Exchange", "Offer"], correctIndex: 0 },
        { id: qid("shopping-money",6), videoKey: "return_item", question: "What action is shown?", options: ["Return item", "Buy item", "Use item", "Sell item"], correctIndex: 0 },
        { id: qid("shopping-money",7), videoKey: "exchange", question: "Choose the correct meaning.", options: ["Exchange", "Refund", "Buy", "Sell"], correctIndex: 0 },
        { id: qid("shopping-money",8), videoKey: "save_money", question: "What does this indicate?", options: ["Save money", "Spend money", "Lose money", "Borrow money"], correctIndex: 0 },
        { id: qid("shopping-money",9), videoKey: "shopping_done", question: "What is being expressed?", options: ["Shopping finished", "Start shopping", "Compare items", "Choose item"], correctIndex: 0 },
    ],
    },
    {
    key: "food-eating",
    title: "Food & Eating",
    questions: [
        { id: qid("food-eating",0), videoKey: "eat", question: "What action is shown?", options: ["Eat", "Drink", "Cook", "Serve"], correctIndex: 0 },
        { id: qid("food-eating",1), videoKey: "drink", question: "Identify the action.", options: ["Drink", "Eat", "Wash", "Pour"], correctIndex: 0 },
        { id: qid("food-eating",2), videoKey: "cook", question: "What is being done?", options: ["Cook", "Eat", "Clean", "Store"], correctIndex: 0 },
        { id: qid("food-eating",3), videoKey: "cut", question: "Choose the correct meaning.", options: ["Cut vegetables", "Wash vegetables", "Eat vegetables", "Buy vegetables"], correctIndex: 0 },
        { id: qid("food-eating",4), videoKey: "boil", question: "What action is shown?", options: ["Boil", "Fry", "Bake", "Serve"], correctIndex: 0 },
        { id: qid("food-eating",5), videoKey: "hungry", question: "What feeling is expressed?", options: ["Hungry", "Full", "Tired", "Thirsty"], correctIndex: 0 },
        { id: qid("food-eating",6), videoKey: "thirsty", question: "Identify the feeling.", options: ["Thirsty", "Hungry", "Cold", "Hot"], correctIndex: 0 },
        { id: qid("food-eating",7), videoKey: "share_food", question: "What does this sign indicate?", options: ["Share food", "Store food", "Cook food", "Waste food"], correctIndex: 0 },
        { id: qid("food-eating",8), videoKey: "wash_hands", question: "What action is shown?", options: ["Wash hands", "Eat food", "Clean plates", "Dry hands"], correctIndex: 0 },
        { id: qid("food-eating",9), videoKey: "finished_eating", question: "What is being expressed?", options: ["Finished eating", "Start eating", "Serve food", "Cook food"], correctIndex: 0 },
    ],
    },
    {
    key: "health-body",
    title: "Health & Body",
    questions: [
        { id: qid("health-body",0), videoKey: "sick", question: "What condition is shown?", options: ["Sick", "Healthy", "Strong", "Happy"], correctIndex: 0 },
        { id: qid("health-body",1), videoKey: "fever", question: "Identify the symptom.", options: ["Fever", "Cough", "Pain", "Cold"], correctIndex: 0 },
        { id: qid("health-body",2), videoKey: "headache", question: "What problem is shown?", options: ["Headache", "Stomach ache", "Back pain", "Fever"], correctIndex: 0 },
        { id: qid("health-body",3), videoKey: "medicine", question: "What is being taken?", options: ["Medicine", "Food", "Water", "Rest"], correctIndex: 0 },
        { id: qid("health-body",4), videoKey: "doctor", question: "Who is being referred to?", options: ["Doctor", "Nurse", "Teacher", "Friend"], correctIndex: 0 },
        { id: qid("health-body",5), videoKey: "hospital", question: "What place is shown?", options: ["Hospital", "Clinic", "Home", "Pharmacy"], correctIndex: 0 },
        { id: qid("health-body",6), videoKey: "exercise", question: "What action is shown?", options: ["Exercise", "Rest", "Sleep", "Eat"], correctIndex: 0 },
        { id: qid("health-body",7), videoKey: "rest", question: "Choose the correct meaning.", options: ["Rest", "Work", "Run", "Travel"], correctIndex: 0 },
        { id: qid("health-body",8), videoKey: "healthy", question: "What condition is expressed?", options: ["Healthy", "Sick", "Weak", "Tired"], correctIndex: 0 },
        { id: qid("health-body",9), videoKey: "emergency", question: "What does this indicate?", options: ["Emergency", "Appointment", "Checkup", "Routine"], correctIndex: 0 },
    ],
    },
    {
    key: "emotions-mind",
    title: "Emotions & Mind",
    questions: [
        { id: qid("emotions-mind",0), videoKey: "happy", question: "What emotion is shown?", options: ["Happy", "Sad", "Angry", "Afraid"], correctIndex: 0 },
        { id: qid("emotions-mind",1), videoKey: "sad", question: "Identify the emotion.", options: ["Sad", "Happy", "Proud", "Excited"], correctIndex: 0 },
        { id: qid("emotions-mind",2), videoKey: "angry", question: "What feeling is expressed?", options: ["Angry", "Calm", "Happy", "Tired"], correctIndex: 0 },
        { id: qid("emotions-mind",3), videoKey: "scared", question: "Choose the correct meaning.", options: ["Scared", "Brave", "Calm", "Excited"], correctIndex: 0 },
        { id: qid("emotions-mind",4), videoKey: "calm", question: "What emotion is shown?", options: ["Calm", "Angry", "Nervous", "Sad"], correctIndex: 0 },
        { id: qid("emotions-mind",5), videoKey: "think", question: "What action is shown?", options: ["Think", "Talk", "Listen", "Act"], correctIndex: 0 },
        { id: qid("emotions-mind",6), videoKey: "remember", question: "Identify the action.", options: ["Remember", "Forget", "Learn", "Teach"], correctIndex: 0 },
        { id: qid("emotions-mind",7), videoKey: "confident", question: "What feeling is expressed?", options: ["Confident", "Nervous", "Sad", "Weak"], correctIndex: 0 },
        { id: qid("emotions-mind",8), videoKey: "relaxed", question: "Choose the correct emotion.", options: ["Relaxed", "Stressed", "Angry", "Afraid"], correctIndex: 0 },
        { id: qid("emotions-mind",9), videoKey: "peace", question: "What is being expressed?", options: ["Peace", "Stress", "Fear", "Anger"], correctIndex: 0 },
    ],
    },
    {
        key: "work-office",
    title: "Work & Office",
    questions: [
        { id: qid("work-office",0), videoKey: "office", question: "What place is shown?", options: ["Office", "School", "Home", "Shop"], correctIndex: 0 },
        { id: qid("work-office",1), videoKey: "work", question: "What action is shown?", options: ["Work", "Rest", "Play", "Sleep"], correctIndex: 0 },
        { id: qid("work-office",2), videoKey: "meeting", question: "Identify the activity.", options: ["Meeting", "Training", "Break", "Travel"], correctIndex: 0 },
        { id: qid("work-office",3), videoKey: "email", question: "What is being sent?", options: ["Email", "Message", "File", "Call"], correctIndex: 0 },
        { id: qid("work-office",4), videoKey: "deadline", question: "What does this indicate?", options: ["Deadline", "Holiday", "Meeting", "Leave"], correctIndex: 0 },
        { id: qid("work-office",5), videoKey: "submit", question: "What action is shown?", options: ["Submit", "Edit", "Delete", "Review"], correctIndex: 0 },
        { id: qid("work-office",6), videoKey: "teamwork", question: "What is being expressed?", options: ["Teamwork", "Competition", "Conflict", "Rest"], correctIndex: 0 },
        { id: qid("work-office",7), videoKey: "presentation", question: "Identify the activity.", options: ["Presentation", "Discussion", "Training", "Interview"], correctIndex: 0 },
        { id: qid("work-office",8), videoKey: "feedback", question: "What is being given?", options: ["Feedback", "Order", "Instruction", "Warning"], correctIndex: 0 },
        { id: qid("work-office",9), videoKey: "finish_work", question: "What does this indicate?", options: ["Work finished", "Start work", "Break time", "Meeting"], correctIndex: 0 },
    ],
    },
    {
    key: "technology",
    title: "Technology",
    questions: [
        { id: qid("technology",0), videoKey: "laptop", question: "What device is shown?", options: ["Laptop", "Mobile", "Tablet", "Desktop"], correctIndex: 0 },
        { id: qid("technology",1), videoKey: "mobile", question: "Identify the device.", options: ["Mobile phone", "Laptop", "Camera", "TV"], correctIndex: 0 },
        { id: qid("technology",2), videoKey: "charge", question: "What action is shown?", options: ["Charging", "Unplugging", "Switching off", "Restarting"], correctIndex: 0 },
        { id: qid("technology",3), videoKey: "restart", question: "Choose the correct meaning.", options: ["Restart device", "Shutdown", "Sleep", "Update"], correctIndex: 0 },
        { id: qid("technology",4), videoKey: "wifi", question: "What does this indicate?", options: ["WiFi", "Bluetooth", "Network error", "Data off"], correctIndex: 0 },
        { id: qid("technology",5), videoKey: "download", question: "What action is shown?", options: ["Download", "Upload", "Delete", "Share"], correctIndex: 0 },
        { id: qid("technology",6), videoKey: "upload", question: "Identify the action.", options: ["Upload", "Download", "Send", "Save"], correctIndex: 0 },
        { id: qid("technology",7), videoKey: "settings", question: "What screen is shown?", options: ["Settings", "Gallery", "Messages", "Browser"], correctIndex: 0 },
        { id: qid("technology",8), videoKey: "security", question: "What does this indicate?", options: ["Security", "Error", "Update", "Warning"], correctIndex: 0 },
        { id: qid("technology",9), videoKey: "technology_help", question: "What is being expressed?", options: ["Technology helps life", "Technology fails", "No internet", "Device broken"], correctIndex: 0 },
    ],
    },
];

// -------------------------
// HELPERS
// -------------------------
export function practiceQuizByKey(key) {
  return practiceQuizCategories.find(c => c.key === key) || null;
}

export function getVideoUrl(videoKey) {
  if (!videoKey) return null;
  return `/videos/${videoKey}.mp4`;
}
