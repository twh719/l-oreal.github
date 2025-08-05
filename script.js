// ✅ Load Product Data
let productData = [];

fetch('product-data.json')
  .then(res => res.json())
  .then(data => {
    productData = data;
  })
  .catch(err => console.error('❌ Failed to load product data:', err));

// ✅ Handle Routine Form Submission
const form = document.getElementById('routine-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const skinType = document.getElementById('skinType').value;
    const concerns = document.getElementById('concerns').value.toLowerCase();
    const ageRange = document.getElementById('age').value;

    if (!skinType || !concerns || !ageRange) {
      alert('Please fill out all fields to build your routine.');
      return;
    }

    const routine = generateRoutine(skinType, concerns, ageRange);
    displayRoutine(routine);
  });
}

// ✅ Generate Custom Routine based on user profile
function generateRoutine(skinType, concerns, ageRange) {
  const steps = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF'];
  return steps.map(step =>
    productData.find(product =>
      product.step === step &&
      product.skinTypes?.includes(skinType) &&
      product.ageRanges?.includes(ageRange) &&
      product.concerns?.some(c => concerns.includes(c))
    )
  ).filter(Boolean);
}

// ✅ Display Routine Cards
function displayRoutine(routine) {
  const output = document.getElementById('routine-steps');
  output.innerHTML = '';

  if (routine.length === 0) {
    output.innerHTML = `<p class="no-results">No routine found for your skin profile. Try adjusting your inputs.</p>`;
    document.getElementById('routine-output').classList.add('hidden');
    return;
  }

  routine.forEach(product => {
    const card = document.createElement('div');
    card.className = 'routine-step';
    card.innerHTML = `
      <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}" />
      <div class="step-info">
        <h3>${product.name}</h3>
        <p><strong>Step:</strong> ${product.step}</p>
        <p>${product.description}</p>
      </div>
    `;
    output.appendChild(card);
  });

  document.getElementById('routine-output').classList.remove('hidden');
}

// ✅ Handle Chat Submission
const chatForm = document.getElementById('chat-form');
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('chat-input');
    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendChatMessage('user', userMessage);
    input.value = '';
    showTyping();

    try {
      const response = await fetchAIResponse(userMessage);
      replaceTypingWithResponse(response);
    } catch (error) {
      replaceTypingWithResponse("Sorry, something went wrong. Please try again.");
      console.error('❌ Chat error:', error);
    }
  });
}

// ✅ Display Message in Chat Log
function appendChatMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const message = document.createElement('div');
  message.className = `chat-message ${sender}`;
  message.innerHTML = `
    ${sender === 'bot'
      ? `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/L%27Or%C3%A9al_logo.svg/80px-L%27Or%C3%A9al_logo.svg.png" alt="L’Oréal Bot" class="chat-logo" />`
      : ''}
    <span><strong>${sender === 'user' ? 'You' : 'L’Oréal Bot'}:</strong> ${text}</span>
  `;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// ✅ Typing Animation
function showTyping() {
  const chatLog = document.getElementById('chat-log');
  const typing = document.createElement('div');
  typing.className = 'chat-message bot typing';
  typing.innerHTML = `
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/L%27Or%C3%A9al_logo.svg/80px-L%27Or%C3%A9al_logo.svg.png" alt="Typing..." class="chat-logo" />
    <span><em>Typing...</em></span>
  `;
  chatLog.appendChild(typing);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// ✅ Replace Typing Animation with AI Response
function replaceTypingWithResponse(text) {
  const chatLog = document.getElementById('chat-log');
  const typing = chatLog.querySelector('.chat-message.typing');
  if (typing) {
    typing.classList.remove('typing');
    typing.querySelector('span').innerHTML = `<strong>L’Oréal Bot:</strong> ${text}`;
  }
}

// ✅ Send Prompt to OpenAI API
async function fetchAIResponse(prompt) {
  if (!apikey) {
    throw new Error("API key is missing");
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apikey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: "You are a helpful L’Oréal skincare assistant. Provide personalized product recommendations and skincare routines based on L’Oréal products."
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices.length) throw new Error("No response from OpenAI");
  return data.choices[0].message.content.trim();
}
