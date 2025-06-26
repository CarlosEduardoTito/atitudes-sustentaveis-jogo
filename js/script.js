// --- DOM Elements ---
const screens = document.querySelectorAll('.screen');
const playerNameInput = document.getElementById('player-name-input');
const startGameButton = document.getElementById('start-game-button');
const nameError = document.getElementById('name-error');

// Phase 1
const fase1Button = document.getElementById('fase1-button');
const intro1NextBtn = document.getElementById('intro1-next');
const intro1BackBtn = document.getElementById('intro1-back');
const intro2NextBtn = document.getElementById('intro2-next');
const intro2BackBtn = document.getElementById('intro2-back');
const quizBackBtn = document.getElementById('quiz-back');
const questionTextBubble = document.getElementById('question-text-bubble');
const answersContainer = document.getElementById('answers-container');
const scoreDisplay = document.getElementById('score-display');
const starsContainer = document.getElementById('stars-container');
const attemptsDisplay = document.getElementById('attempts-display');
const restartPhase1Button = document.getElementById('restart-phase1-button');
const backToMenuButton1 = document.getElementById('back-to-menu-button1');
const quizFeedback = document.getElementById('quiz-feedback');

// Phase 2
const fase2Button = document.getElementById('fase2-button');
const phase2IntroNextBtn = document.getElementById('phase2-intro-next');
const phase2IntroBackBtn = document.getElementById('phase2-intro-back');
const plantHolesContainer = document.querySelector('.plant-holes');
const staticPlantsContainer = document.querySelector('.static-plants-container');
const phase2ScoreDisplay = document.getElementById('phase2-score-display');
const restartPhase2Button = document.getElementById('restart-phase2-button');
const backToMenuButton2 = document.getElementById('back-to-menu-button2');

// Common
const micButtons = document.querySelectorAll('[id^="mic-"]');

// --- Game State & Data ---
let currentPhase = 0;
let playerName = 'Jogador';
const synth = window.speechSynthesis;

// Phase 1 State
let currentQuestionIndex = 0, stars = 0, attempts = 0, firstTry = true;
let p1InactivityTimer, p1HintTimer;
let p1GameData = [];
let p1PhaseStartTime;

// Phase 2 State
let phase2Items = [];
let shuffledPhase2Items = [];
let p2GoodScore = 0, p2BadScore = 0;
let p2Timeouts = [];
let p2BatchCount = 0;
let p2GameData = [];
let p2PhaseStartTime;

// --- Questions & Items Data ---
const questions = [
    { question: "O que devemos fazer ao escovar os dentes?", answers: [{ text: "A) Deixar a torneira aberta.", correct: false }, { text: "B) Fechar a torneira enquanto escovamos.", correct: true }, { text: "C) Usar muita água.", correct: false }], correctAnswerText: "Fechar a torneira enquanto escovamos." },
    { question: "Qual água é boa para beber?", answers: [{ text: "A) Água do mar.", correct: false }, { text: "B) Água tratada.", correct: true }, { text: "C) Água da chuva.", correct: false }], correctAnswerText: "Água tratada." },
    { question: "O que fazer quando a torneira está vazando?", answers: [{ text: "A) Brincar com a água.", correct: false }, { text: "B) Deixar vazando.", correct: false }, { text: "C) Avisar alguém para arrumar.", correct: true }], correctAnswerText: "Avisar alguém para arrumar." },
    { question: "Qual dessas atitudes ajuda o planeta?", answers: [{ text: "A) Usar água com cuidado.", correct: true }, { text: "B) Jogar Lixo no rio.", correct: false }, { text: "C) Deixar a luz acesa o dia todo.", correct: false }], correctAnswerText: "Usar água com cuidado." },
    { question: "Qual dessas opções ajuda a economizar água em casa?", answers: [{ text: "A) Deixar a torneira aberta enquanto escova os dentes.", correct: false }, { text: "B) Tomar banhos muito longos.", correct: false }, { text: "C) Fechar a torneira enquanto escova os dentes.", correct: true }], correctAnswerText: "Fechar a torneira enquanto escova os dentes." }
];

function getPhase2Items() {
    return [
        {
            name: 'Luz do Sol',
            type: 'good',
            icon: `<img src="img/luz-do-sol.png" alt="Luz do Sol" style="width:100%;height:100%;">`
        },
        {
            name: 'Adubo',
            type: 'good',
            icon: `<img src="img/adubo.png" alt="Adubo" style="width:100%;height:100%;">`
        },
        {
            name: 'Água Potável',
            type: 'good',
            icon: `<img src="img/agua-potavel.png" alt="Água Potável" style="width:100%;height:100%;">`
        },
        {
            name: 'Lixo',
            type: 'bad',
            icon: `<img src="img/lixo.png" alt="Lixo" style="width:100%;height:100%;">`
        },
        {
            name: 'Água Poluída',
            type: 'bad',
            icon: `<img src="img/agua-poluida.png" alt="Água Poluída" style="width:100%;height:100%;">`
        },
        {
            name: 'Inseto',
            type: 'bad',
            icon: `<img src="img/inseto.png" alt="Inseto" style="width:100%;height:100%;">`
        }
    ];
}

// --- Opções/Settings ---
let voiceVolume = 1.0;

// --- Core Functions ---
// Function to load voices and ensure speech is ready
function initSpeechSynthesis(callback) {
    if (synth.getVoices().length !== 0) {
        if(callback) callback();
        return;
    }
    synth.onvoiceschanged = () => {
        if(callback) callback();
    };
}

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
    activeScreen.scrollTop = 0;
    setTimeout(() => speakCurrentScreenText(screenId), 100);
}

function speak(text, onEndCallback = null) {
    if (synth.speaking) synth.cancel();
    if (text) {
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.lang = 'pt-BR';
        utterThis.volume = voiceVolume;
        if (onEndCallback) utterThis.onend = onEndCallback;
        synth.speak(utterThis);
    } else if (onEndCallback) {
        onEndCallback();
    }
}

function speakCurrentScreenText(screenId) {
    let textToSpeak = '';
    switch(screenId) {
        case 'name-screen': textToSpeak = 'Escreva seu nome completo'; break;
        case 'menu-screen': textToSpeak = 'Atitudes Sustentáveis. Fase 1: responda as perguntas e ganhe estrelas. Fase 2: ajude a cuidar de uma horta.'; break;
        case 'intro-screen-1': textToSpeak = 'Atitudes Sustentáveis. acerte as respostas e ganhe estrelas'; break;
        case 'intro-screen-2': textToSpeak = 'Preste muita atenção, você só vai ganhar uma estrela se responder certo na primeira tentativa'; break;
        case 'quiz-screen': if (currentQuestionIndex < questions.length) { const q = questions[currentQuestionIndex]; textToSpeak = q.question + q.answers.map(a => `. ${a.text}`).join(''); } break;
        case 'score-screen': textToSpeak = document.getElementById('score-display').innerText + ". " + document.getElementById('attempts-display').innerText; break;
        case 'phase2-intro-screen': 
            textToSpeak = 'Ajude a cuidar da horta, Clique no que faz bem para as plantas'; 
            break;
        case 'phase2-game-screen': textToSpeak = 'Clique nas coisas boas que aparecerem na horta.'; break;
        case 'phase2-score-screen': textToSpeak = document.getElementById('phase2-score-display').innerText; break;
    }
    speak(textToSpeak);
}

function goToMenu() {
    clearP1Timers();
    p2Timeouts.forEach(clearTimeout);
    showScreen('menu-screen');
}

// --- PHASE 1: QUIZ ---
function startPhase1() {
    currentPhase = 1;
    currentQuestionIndex = 0, stars = 0, attempts = 0;
    p1GameData = [], p1PhaseStartTime = new Date();
    showScreen('intro-screen-1');
}

function showQuestion() {
    clearP1Timers();
    firstTry = true;
    quizFeedback.innerHTML = ''; // Limpa feedback ao mostrar nova pergunta
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        questionTextBubble.textContent = question.question;
        answersContainer.innerHTML = '';
        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = answer.text;
            button.className = 'answer-button';
            button.dataset.correct = answer.correct;
            answersContainer.appendChild(button);
            button.addEventListener('click', selectAnswer);
        });
        quizBackBtn.style.display = (currentQuestionIndex === 0) ? 'block' : 'none';
        showScreen('quiz-screen');
        startP1InactivityTimer();
    } else {
        showScoreAndDownloadReport1();
    }
}

function selectAnswer(e) {
    clearP1Timers();
    const selectedButton = e.currentTarget;
    const isCorrect = selectedButton.dataset.correct === 'true';
    attempts++;

    if (isCorrect) {
        selectedButton.classList.add('correct');
        if (firstTry) {
            stars++;
            quizFeedback.innerHTML = `<span style="color:#28a745;font-weight:bold;">Muito bem!</span> <span style="font-size:2.5rem;vertical-align:middle;margin-left:0.5rem;color:#FFD700;">&#9733;</span>`;
            speak("Muito bem! Resposta certa.");
            recordP1Answer(true, true);
        }
        else {
            quizFeedback.innerHTML = `<span style="color:#28a745;font-weight:bold;">Muito bem!</span>`;
            speak("Boa escolha! Agora sim.");
            recordP1Answer(true, false);
        }
        document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = true);
        setTimeout(() => { quizFeedback.innerHTML = ''; currentQuestionIndex++; showQuestion(); }, 2000);
    } else {
        selectedButton.classList.add('incorrect');
        quizFeedback.innerHTML = `<span style="color:#dc3545;font-weight:bold;">Tente novamente!</span>`;
        speak("Tente novamente!");
        firstTry = false;
        setTimeout(() => { selectedButton.style.visibility = 'hidden'; quizFeedback.innerHTML = ''; startP1InactivityTimer(); }, 1500);
    }
}

function showScoreAndDownloadReport1() {
    clearP1Timers();
    showScreen('score-screen');
    const scoreText = `Você ganhou ${stars} ${stars === 1 ? 'estrela' : 'estrelas'}`;
    scoreDisplay.textContent = scoreText;
    starsContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) { starsContainer.innerHTML += i < stars ? '&#9733;' : '&#9734;'; }
    attemptsDisplay.textContent = `Foram feitas ${attempts} tentativas`;
    speak(scoreText);
    downloadReport(1);
}

function startP1InactivityTimer() {
    clearP1Timers();
    p1InactivityTimer = setTimeout(() => {
        giveP1Hint();
        p1HintTimer = setTimeout(showP1CorrectAnswerAndAdvance, 60000);
    }, 60000);
}

function clearP1Timers() { clearTimeout(p1InactivityTimer); clearTimeout(p1HintTimer); }
function giveP1Hint() {
    speak("Precisa de uma ajuda? Olhe a dica na tela.");
    const correctButton = document.querySelector('.answer-button[data-correct="true"]');
    if (correctButton) correctButton.classList.add('hint');
}

function showP1CorrectAnswerAndAdvance() {
    if (synth.speaking) synth.cancel();
    const currentQ = questions[currentQuestionIndex];
    recordP1Answer(false, false, true);
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.disabled = true;
        if(btn.dataset.correct === 'true') btn.classList.add('correct');
    });
    const questionNarration = `O tempo acabou. A pergunta era: ${currentQ.question}`;
    const answerNarration = `A resposta correta é: ${currentQ.correctAnswerText}`;
    speak(questionNarration, () => {
        speak(answerNarration, () => {
            currentQuestionIndex++;
            showQuestion();
        });
    });
}
function recordP1Answer(answeredCorrectly, gotStar, notAnswered = false) { p1GameData.push({ question: questions[currentQuestionIndex].question, answeredCorrectly, gotStar, notAnswered }); }

// --- PHASE 2: HORTA ---
function startPhase2() {
    currentPhase = 2;
    p2GoodScore = 0; p2BadScore = 0;
    p2GameData = [];
    p2PhaseStartTime = new Date();
    phase2Items = getPhase2Items();
    shuffledPhase2Items = phase2Items.slice().sort(() => 0.5 - Math.random()); // corrigido: use slice() para copiar
    // Remova ou comente a linha abaixo se não quiser plantas estáticas
    // addStaticPlants();
    showScreen('phase2-intro-screen');
}

function runPhase2Game() {
    showScreen('phase2-game-screen');
    setTimeout(showNextPhase2Batch, 1000);
}

// --- Phase 2 Flower Sync ---
// Sincroniza a flor abaixo do balão (planta) correspondente
function setFlowerState(index, up) {
    const flowers = document.querySelectorAll('.flowers-row .flower-on-ground');
    if (flowers[index]) {
        flowers[index].classList.remove('up', 'down');
        // Força reflow para reiniciar animação se necessário
        void flowers[index].offsetWidth;
        flowers[index].classList.add(up ? 'up' : 'down');
    }
}

function showNextPhase2Batch() {
    p2Timeouts.forEach(clearTimeout);
    p2Timeouts = [];
    p2BatchCount = 0;
    
    const batch = shuffledPhase2Items.splice(0, 3);
    if (batch.length === 0) {
        // Ao terminar, desce todas as flores
        for (let i = 0; i < 3; i++) setFlowerState(i, false);
        showScoreAndDownloadReport2();
        return;
    }

    const holes = Array.from(document.querySelectorAll('.hole'));
    holes.forEach((hole, i) => {
        hole.innerHTML = '';
        // Desce a flor correspondente antes de subir novamente
        setFlowerState(i, false);
    });

    batch.forEach((item, index) => {
        const hole = holes[index];
        const plantItem = document.createElement('div');
        plantItem.className = 'plant-item';
        plantItem.dataset.type = item.type;
        plantItem.dataset.name = item.name;
        plantItem.innerHTML = `
            <div class="plant-item-icon">${item.icon}</div>
            <div class="plant-item-text">${item.name}</div>
            <div class="feedback-overlay"></div>
        `;
        hole.appendChild(plantItem);

        setTimeout(() => {
            plantItem.classList.add('visible');
            setFlowerState(index, true); // Sobe a flor junto com o balão
        }, 100 * (index + 1));

        plantItem.addEventListener('click', handlePlantClick);

        // Tempo de inatividade reduzido de 60s para 40s
        const timeoutId = setTimeout(() => {
            recordP2Answer(item.name, item.type, 'not_clicked');
            hidePlant(plantItem, true, index);
        }, 40000);
        p2Timeouts.push(timeoutId);
        plantItem.dataset.timeoutId = timeoutId;
    });
}

// Modifique hidePlant para sincronizar a descida da flor
function hidePlant(plantItem, checkBatch, holeIndex = null) {
    if (!plantItem) return;
    // Descobre o índice do hole correspondente se não foi passado
    if (holeIndex === null) {
        const holes = Array.from(document.querySelectorAll('.hole'));
        holeIndex = holes.findIndex(hole => hole.contains(plantItem));
    }
    plantItem.classList.remove('visible');
    setFlowerState(holeIndex, false); // Desce a flor junto com o balão
    setTimeout(() => {
        plantItem.remove();
        if (checkBatch) {
            p2BatchCount++;
            const holes = Array.from(document.querySelectorAll('.hole'));
            const activeItems = holes.filter(h => h.childElementCount > 0).length;
            if (activeItems === 0) {
                setTimeout(showNextPhase2Batch, 500);
            }
        }
    }, 500);
}

function handlePlantClick(e) {
    const plantItem = e.currentTarget;
    clearTimeout(parseInt(plantItem.dataset.timeoutId));
    plantItem.removeEventListener('click', handlePlantClick);
    
    const type = plantItem.dataset.type;
    const name = plantItem.dataset.name;
    const feedbackOverlay = plantItem.querySelector('.feedback-overlay');
    
    if (type === 'good') {
        p2GoodScore++; speak("Parabéns!");
        feedbackOverlay.innerHTML = '&#10004;';
        feedbackOverlay.classList.add('correct', 'show');
        recordP2Answer(name, type, 'correct');
    } else {
        p2BadScore++; speak("Acho que isso não faz bem.");
        feedbackOverlay.innerHTML = '&#10006;';
        feedbackOverlay.classList.add('incorrect', 'show');
        recordP2Answer(name, type, 'incorrect');
    }
    setTimeout(() => hidePlant(plantItem, true), 1200);
}

function showScoreAndDownloadReport2() {
    p2Timeouts.forEach(clearTimeout);
    showScreen('phase2-score-screen');
    const totalGood = getPhase2Items().filter(i => i.type === 'good').length;
    const totalBad = getPhase2Items().filter(i => i.type === 'bad').length;

    // SVGs para carinha feliz e triste (preenchida e vazia)
    const happyFilled = `<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#ffe066" stroke="#bfa600" stroke-width="3"/><circle cx="16" cy="20" r="3" fill="#333"/><circle cx="32" cy="20" r="3" fill="#333"/><path d="M16 30 Q24 38 32 30" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    const happyEmpty = `<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="none" stroke="#bfa600" stroke-width="3"/><circle cx="16" cy="20" r="3" fill="#333"/><circle cx="32" cy="20" r="3" fill="#333"/><path d="M16 30 Q24 38 32 30" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    const sadFilled = `<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#ffd6d6" stroke="#b94a4a" stroke-width="3"/><circle cx="16" cy="20" r="3" fill="#333"/><circle cx="32" cy="20" r="3" fill="#333"/><path d="M16 34 Q24 26 32 34" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    const sadEmpty = `<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="none" stroke="#b94a4a" stroke-width="3"/><circle cx="16" cy="20" r="3" fill="#333"/><circle cx="32" cy="20" r="3" fill="#333"/><path d="M16 34 Q24 26 32 34" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

    // Monta as carinhas de acerto
    let happyIcons = '';
    for (let i = 0; i < totalGood; i++) {
        happyIcons += i < p2GoodScore ? happyFilled : happyEmpty;
    }
    // Monta as carinhas de erro
    let sadIcons = '';
    for (let i = 0; i < totalBad; i++) {
        sadIcons += i < p2BadScore ? sadFilled : sadEmpty;
    }

    document.getElementById('score-board-left-text').innerHTML =
        `<span style="white-space:nowrap;">Você acertou <b>${p2GoodScore}</b></span> <span class="score-faces">${happyIcons}</span>`;
    document.getElementById('score-board-right-text').innerHTML =
        `<span style="white-space:nowrap;">Você errou <b>${p2BadScore}</b></span> <span class="score-faces">${sadIcons}</span>`;

    const scoreText = `Você acertou ${p2GoodScore} de ${totalGood} e errou ${p2BadScore} de ${totalBad}.`;
    // Fala primeiro a frase, depois a pontuação
    speak("Vamos ver quantos pontos você ganhou.", () => {
        speak(scoreText);
    });
    downloadReport(2);
}
function recordP2Answer(name, type, result) { p2GameData.push({ name, type, result }); }

// --- REPORTING ---
function downloadReport(phase) {
    const phaseEndTime = new Date();
    let reportHTML = ``;

    if (phase === 1) {
        const timeTaken = Math.round((phaseEndTime - p1PhaseStartTime) / 1000);
        reportHTML = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Relatório Fase 1 - ${playerName}</title>
        <style>body{font-family: sans-serif; margin: 20px; line-height: 1.6;} h1, h2 {color: #333;} .item-block {border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px;}</style></head><body>
        <h1>Relatório de Desempenho - Fase 1: Quiz</h1><p><strong>Jogador:</strong> ${playerName}</p><p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Tempo Total:</strong> ${timeTaken} segundos</p><p><strong>Pontuação Final:</strong> ${stars} / 5 estrelas</p><p><strong>Total de Tentativas:</strong> ${attempts}</p><hr><h2>Detalhes por Pergunta:</h2>`;
        p1GameData.forEach((data, index) => {
            reportHTML += `<div class="item-block"><p><strong>Pergunta ${index + 1}:</strong> ${data.question}</p><p><strong>Resultado:</strong> ${data.notAnswered ? '<span style="color:orange;">Não Respondida (tempo esgotado)</span>' : data.gotStar ? '<span style="color:green;">Acertou de Primeira (ganhou estrela)</span>' : '<span style="color:blue;">Acertou após tentativas</span>'}</p>`;
            if (!data.gotStar && !data.notAnswered) { reportHTML += `<p style="color:red;"><em>(Aluno teve dificuldade nesta questão)</em></p>`; } reportHTML += `</div>`;
        });
    } else if (phase === 2) {
        const timeTaken = Math.round((phaseEndTime - p2PhaseStartTime) / 1000);
        reportHTML = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Relatório Fase 2 - ${playerName}</title>
        <style>body{font-family: sans-serif; margin: 20px; line-height: 1.6;} h1, h2 {color: #333;} .item-block {border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px;}</style></head><body>
        <h1>Relatório de Desempenho - Fase 2: Horta</h1><p><strong>Jogador:</strong> ${playerName}</p><p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Tempo Total:</strong> ${timeTaken} segundos</p><p><strong>Acertos (Itens Bons):</strong> ${p2GoodScore} / 3</p><p><strong>Erros (Itens Ruins):</strong> ${p2BadScore} / 3</p><hr><h2>Detalhes por Item:</h2>`;
        getPhase2Items().forEach(item => {
            const clickData = p2GameData.find(d => d.name === item.name);
            let resultText = 'Não clicado';
            if (clickData) {
                if (clickData.result === 'correct') resultText = '<span style="color:green;">Clicou Certo (Item Bom)</span>';
                if (clickData.result === 'incorrect') resultText = '<span style="color:red;">Clicou Errado (Item Ruim)</span>';
            }
            reportHTML += `<div class="item-block"><p><strong>Item:</strong> ${item.name} (${item.type})</p><p><strong>Ação:</strong> ${resultText}</p></div>`;
        });
    }
    reportHTML += `</body></html>`;
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio-Fase${phase}-${playerName.replace(/\s/g, '_')}-${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// --- Event Listeners ---
startGameButton.addEventListener('click', () => {
    initSpeechSynthesis(() => {
        const playerNameValue = playerNameInput.value.trim();
        if (playerNameValue === '') {
            nameError.style.display = 'block';
            speak('Por favor, escreva seu nome para começar.');
        } else {
            playerName = playerNameValue; nameError.style.display = 'none'; showScreen('menu-screen');
        }
    });
});
playerNameInput.addEventListener('input', () => { if (playerNameInput.value.trim() !== '') { nameError.style.display = 'none'; } });

fase1Button.addEventListener('click', startPhase1);
fase2Button.addEventListener('click', startPhase2);
phase2IntroNextBtn.addEventListener('click', runPhase2Game);

intro1NextBtn.addEventListener('click', () => showScreen('intro-screen-2'));
intro1BackBtn.addEventListener('click', goToMenu);
intro2NextBtn.addEventListener('click', showQuestion);
intro2BackBtn.addEventListener('click', () => showScreen('intro-screen-1'));
quizBackBtn.addEventListener('click', () => showScreen('intro-screen-2'));
restartPhase1Button.addEventListener('click', startPhase1);
backToMenuButton1.addEventListener('click', goToMenu);

phase2IntroBackBtn.addEventListener('click', goToMenu);
restartPhase2Button.addEventListener('click', startPhase2);
backToMenuButton2.addEventListener('click', goToMenu);

micButtons.forEach(btn => btn.addEventListener('click', () => speakCurrentScreenText(document.querySelector('.screen.active').id)));

// --- Settings/Options Modal Logic ---
const optionsModal = document.getElementById('options-modal');
const closeOptionsModalBtn = document.getElementById('close-options-modal');
const voiceVolumeSlider = document.getElementById('voice-volume');
const voiceVolumeValue = document.getElementById('voice-volume-value');
const restartCurrentPhaseBtn = document.getElementById('restart-current-phase');
const backToMenuFromOptionsBtn = document.getElementById('back-to-menu-from-options');

// Função para abrir o modal de opções
function openOptionsModal() {
    optionsModal.style.display = 'flex';
    voiceVolumeSlider.value = voiceVolume;
    voiceVolumeValue.textContent = Math.round(voiceVolume * 100) + '%';
}

// Função para fechar o modal de opções
function closeOptionsModal() {
    optionsModal.style.display = 'none';
}

// Botões de engrenagem nas telas de fase
['settings-btn-quiz', 'settings-btn-score1', 'settings-btn-phase2-intro', 'settings-btn-phase2-game', 'settings-btn', 'settings-btn-intro1', 'settings-btn-intro2'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openOptionsModal);
});

// Botão de fechar (X)
closeOptionsModalBtn.addEventListener('click', closeOptionsModal);

// Slider de volume
voiceVolumeSlider.addEventListener('input', function() {
    voiceVolume = parseFloat(this.value);
    voiceVolumeValue.textContent = Math.round(voiceVolume * 100) + '%';
    // Se estiver falando, atualiza o volume imediatamente
    if (synth.speaking) {
        synth.cancel(); // Para a fala atual
        // Repete a fala da tela ativa com novo volume
        speakCurrentScreenText(document.querySelector('.screen.active').id);
    }
});

// Reiniciar fase atual
restartCurrentPhaseBtn.addEventListener('click', function() {
    closeOptionsModal();
    if (currentPhase === 1) startPhase1();
    else if (currentPhase === 2) startPhase2();
});

// Voltar ao menu
backToMenuFromOptionsBtn.addEventListener('click', function() {
    closeOptionsModal();
    goToMenu();
});

// Fechar modal ao clicar fora da caixa
optionsModal.addEventListener('click', function(e) {
    if (e.target === optionsModal) closeOptionsModal();
});

// Initialize speech synthesis on load
initSpeechSynthesis();

// Botão de pular tempo (skip wait) na fase 2
const phase2SkipWaitBtn = document.getElementById('phase2-skip-wait-btn');
if (phase2SkipWaitBtn) {
    phase2SkipWaitBtn.addEventListener('click', () => {
        // Verifica se todos os itens bons já foram clicados
        const holes = Array.from(document.querySelectorAll('.hole'));
        let allGoodsFound = true;
        holes.forEach(hole => {
            const plantItem = hole.querySelector('.plant-item');
            if (plantItem && plantItem.dataset.type === 'good') {
                allGoodsFound = false;
            }
        });
        if (allGoodsFound) {
            // Remove imediatamente todos os itens ruins restantes
            holes.forEach((hole, idx) => {
                const plantItem = hole.querySelector('.plant-item');
                if (plantItem && plantItem.dataset.type === 'bad') {
                    clearTimeout(parseInt(plantItem.dataset.timeoutId));
                    hidePlant(plantItem, true, idx);
                }
            });
        } else {
            // Feedback opcional: pode falar ou piscar o botão
            speak("Você ainda não achou todas as coisas boas.");
            phase2SkipWaitBtn.style.transform = "scale(1.15)";
            setTimeout(() => { phase2SkipWaitBtn.style.transform = ""; }, 400);
        }
    });
    // Narração do tooltip ao passar o mouse
    phase2SkipWaitBtn.addEventListener('mouseenter', () => {
        speak("Se já achou todas as coisas boas, clique aqui para as coisas ruins sumirem mais rápido.");
    });
}
