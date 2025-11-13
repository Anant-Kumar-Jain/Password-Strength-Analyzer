class PasswordCriterion {
    constructor(name, scoreValue) {
        this.name = name;
        this.scoreValue = scoreValue;
    }
    check(password) {
        throw new Error("The 'check' method must be implemented by the subclass.");
    }
}


class LengthCriterion extends PasswordCriterion {
    constructor() {
        super("Minimum Length (8 characters)", 25);
    }
    check(password) {

        const isMet = password.length >= 8;
        return { 
            met: isMet, 
            message: isMet ? "Great! Password is 8+ characters long." : `Needs ${Math.max(0, 8 - password.length)} more character(s).`,
            score: isMet ? this.scoreValue : 0
        };
    }
}

class TypeCriterion extends PasswordCriterion {
    constructor() {
        super("Character Complexity (4 types)", 50);
    }
    check(password) {
        let hasUpper = false;
        let hasLower = false;
        let hasDigit = false;
        let hasSpecial = false;
        

        for (const char of password) {
            if (char >= 'A' && char <= 'Z') hasUpper = true;
            else if (char >= 'a' && char <= 'z') hasLower = true;
            else if (char >= '0' && char <= '9') hasDigit = true;
            else if ('!@#$%^&*()-+=~`[]{}|\\:;"\'<>,.?/'.includes(char)) hasSpecial = true;
        }

        const typesMet = [hasUpper, hasLower, hasDigit, hasSpecial].filter(b => b).length;
        const isMet = typesMet === 4;
        
        let missingTypes = [];
        if (!hasUpper) missingTypes.push("Uppercase");
        if (!hasLower) missingTypes.push("Lowercase");
        if (!hasDigit) missingTypes.push("Digit");
        if (!hasSpecial) missingTypes.push("Special Char");

        const message = isMet 
            ? "Excellent! All 4 character types are present." 
            : `Missing: ${missingTypes.join(', ')}.`;

        const awardedScore = Math.floor(this.scoreValue * (typesMet / 4));
        return { met: isMet, message: message, score: awardedScore };
    }
}


class RepetitionCriterion extends PasswordCriterion {
    constructor() {
        super("No Repetitive Sequences (AAA)", 15);
    }
    check(password) {
        const repetitionRegex = /(.)\1\1/; 
        const isMet = !repetitionRegex.test(password);

        return { 
            met: isMet, 
            message: isMet ? "No obvious triple repetitions found." : "Warning: Contains three or more identical characters in a row (e.g., 'aaa').",
            score: isMet ? this.scoreValue : 0
        };
    }
}


class DictionaryCriterion extends PasswordCriterion {
    constructor() {
        super("Not a Common Word/Pattern", 10);
        this.weakList = [
            "password", "123456", "qwerty", "admin", "qazwsx", "12345678", "abc", "god", "user", "access"
        ];
    }
    check(password) {
        const lowerPassword = password.toLowerCase();
        const isWeak = this.weakList.some(weak => lowerPassword.includes(weak));
        const isMet = !isWeak;

        return { 
            met: isMet, 
            message: isMet ? "Password does not contain common dictionary words." : "Warning: Contains a common or dictionary word/sequence.",
            score: isMet ? this.scoreValue : 0
        };
    }
}


class PasswordChecker {
    constructor() {
        this.criteria = [
            new LengthCriterion(),
            new TypeCriterion(),
            new RepetitionCriterion(),
            new DictionaryCriterion()
        ];
    }

    /**
    @param {string} password - The input password string.
    @returns {{score: number, results: Array<Object>}}
     */
    
    check(password) {
        if (!password || password.length === 0) {
            return { score: 0, results: [] };
        }

        let totalScore = 0;
        let results = [];

        for (const criterion of this.criteria) {
            const result = criterion.check(password);
            totalScore += result.score;
            results.push({ name: criterion.name, ...result });
        }

        return { score: Math.min(totalScore, 100), results: results };
    }
}

const checker = new PasswordChecker();
const inputElement = document.getElementById('passwordInput');
const meterElement = document.getElementById('strengthMeter');
const textElement = document.getElementById('strengthText');
const feedbackElement = document.getElementById('feedbackArea');



function checkPassword() {
    // Check if DOM elements are available before proceeding
    if (!inputElement || !meterElement || !textElement || !feedbackElement) return;

    const password = inputElement.value;
    const { score, results } = checker.check(password);

    const percentage = score;
 
    let strengthText = 'Weak';
    let color = '#ef4444'; // Red

    if (percentage >= 75) {
        strengthText = 'Very Strong';
        color = '#10b981'; // Green
    } else if (percentage >= 50) {
        strengthText = 'Strong';
        color = '#f59e0b'; // Yellow/Orange
    } else if (percentage > 0) {
        strengthText = 'Medium';
        color = '#f97316'; // Orange
    } else {
        strengthText = 'N/A';
        color = '#6b7280'; // Gray
    }

    meterElement.style.width = `${percentage}%`;
    meterElement.style.backgroundColor = color;
    textElement.textContent = `${strengthText} (${percentage}%)`;
    textElement.className = `font-semibold ${password.length === 0 ? 'text-gray-400' : ''}`;

    feedbackElement.innerHTML = `<h2 class="text-lg font-semibold mb-3 text-green-400">Evaluation Criteria:</h2>`;
    
    if (password.length > 0) {
        results.forEach(res => {
            const statusClass = res.met 
                ? 'border-green-500 text-green-300' 
                : 'border-yellow-500 text-yellow-300';
            
            const icon = res.met ? '&#10004;' : '&#10006;'; 

            const html = `
                <div class="feedback-item ${statusClass} flex justify-between items-start text-sm">
                    <span class="font-medium">${icon} ${res.name}</span>
                    <span class="text-xs text-gray-400">${res.message}</span>
                </div>
            `;
            feedbackElement.innerHTML += html;
        });
    } else {
        feedbackElement.innerHTML += '<p class="text-sm text-gray-500">Start typing to check your password strength.</p>';
    }
}