// DOM Elements
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const lengthDisplay = document.getElementById('lengthDisplay');
const uppercaseCheckbox = document.getElementById('uppercase');
const lowercaseCheckbox = document.getElementById('lowercase');
const numbersCheckbox = document.getElementById('numbers');
const symbolsCheckbox = document.getElementById('symbols');
const similarCharsCheckbox = document.getElementById('similarChars');
const ambiguousCharsCheckbox = document.getElementById('ambiguousChars');
const generateBtn = document.getElementById('generateBtn');
const passwordDisplay = document.getElementById('passwordDisplay');
const strengthFill = document.getElementById('strengthFill');
const strengthValue = document.getElementById('strengthValue');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const historyList = document.getElementById('historyList');

// متغيرات حفظ كلمات المرور
let isSignedIn = false;

// Character sets
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const similarCharsToExclude = 'il1Lo0';
const ambiguousCharsToExclude = '{}[]()/\'"`~,;:.<>';

// Password history - استخدام sessionStorage بدلاً من متغير عام
const MAX_HISTORY = 5;
let passwordHistory = [];

// تحميل سجل كلمات المرور من sessionStorage عند بدء التشغيل
function loadPasswordHistory() {
    const savedHistory = sessionStorage.getItem('passwordHistory');
    if (savedHistory) {
        passwordHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
}

// حفظ سجل كلمات المرور في sessionStorage
function savePasswordHistory() {
    // تشفير كلمات المرور قبل حفظها
    const encryptedHistory = passwordHistory.map(password => btoa(password));
    sessionStorage.setItem('passwordHistory', JSON.stringify(encryptedHistory));
}

// تحميل سجل كلمات المرور عند بدء التشغيل
loadPasswordHistory();

// Update length display when slider changes
lengthSlider.addEventListener('input', function() {
    const length = this.value;
    lengthValue.textContent = length;
    lengthDisplay.textContent = length;
});

// Generate password function
function generatePassword() {
    // Get selected options
    const length = parseInt(lengthSlider.value);
    const includeUppercase = uppercaseCheckbox.checked;
    const includeLowercase = lowercaseCheckbox.checked;
    const includeNumbers = numbersCheckbox.checked;
    const includeSymbols = symbolsCheckbox.checked;
    const excludeSimilar = similarCharsCheckbox.checked;
    const excludeAmbiguous = ambiguousCharsCheckbox.checked;

    // Validate at least one character type is selected
    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        passwordDisplay.textContent = "الرجاء اختيار نوع واحد على الأقل من الأحرف";
        passwordDisplay.style.color = "var(--light-red)";
        updateStrengthIndicator(0);
        return;
    }

    // Build character pool based on selected options
    let charPool = '';

    if (includeUppercase) {
        let uppercasePool = uppercaseChars;
        if (excludeSimilar) {
            uppercasePool = uppercasePool.split('').filter(char => !similarCharsToExclude.includes(char)).join('');
        }
        if (excludeAmbiguous) {
            uppercasePool = uppercasePool.split('').filter(char => !ambiguousCharsToExclude.includes(char)).join('');
        }
        charPool += uppercasePool;
    }

    if (includeLowercase) {
        let lowercasePool = lowercaseChars;
        if (excludeSimilar) {
            lowercasePool = lowercasePool.split('').filter(char => !similarCharsToExclude.includes(char)).join('');
        }
        if (excludeAmbiguous) {
            lowercasePool = lowercasePool.split('').filter(char => !ambiguousCharsToExclude.includes(char)).join('');
        }
        charPool += lowercasePool;
    }

    if (includeNumbers) {
        let numberPool = numberChars;
        if (excludeSimilar) {
            numberPool = numberPool.split('').filter(char => !similarCharsToExclude.includes(char)).join('');
        }
        if (excludeAmbiguous) {
            numberPool = numberPool.split('').filter(char => !ambiguousCharsToExclude.includes(char)).join('');
        }
        charPool += numberPool;
    }

    if (includeSymbols) {
        let symbolPool = symbolChars;
        if (excludeAmbiguous) {
            symbolPool = symbolPool.split('').filter(char => !ambiguousCharsToExclude.includes(char)).join('');
        }
        charPool += symbolPool;
    }

    // Ensure we have characters in the pool
    if (charPool.length === 0) {
        passwordDisplay.textContent = "لا توجد أحرف صالحة مع الإعدادات الحالية";
        passwordDisplay.style.color = "var(--light-red)";
        updateStrengthIndicator(0);
        return;
    }

    // Generate password with better randomness and character distribution
    let password = '';
    const charPoolLength = charPool.length;

    // استخدام Crypto API لتحسين العشوائية
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        const randomIndex = randomValues[i] % charPoolLength;
        password += charPool[randomIndex];
    }

    // التأكد من أن كلمة المرور تحتوي على أنواع الأحرف المطلوبة
    let hasUppercase = !includeUppercase || /[A-Z]/.test(password);
    let hasLowercase = !includeLowercase || /[a-z]/.test(password);
    let hasNumbers = !includeNumbers || /[0-9]/.test(password);
    let hasSymbols = !includeSymbols || /[^A-Za-z0-9]/.test(password);

    // إذا لم تحتوي كلمة المرور على جميع الأنواع المطلوبة، أعد إنشائها
    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSymbols) {
        return generatePassword(); // استدعاء الدالة مرة أخرى
    }

    // Display password with visual feedback
    passwordDisplay.textContent = password;
    passwordDisplay.style.color = "var(--light-green)";
    passwordDisplay.classList.add("password-pulse");
    setTimeout(() => {
        passwordDisplay.classList.remove("password-pulse");
    }, 500);

    // Calculate and display password strength
    const strength = calculatePasswordStrength(password, length);
    updateStrengthIndicator(strength);

    // Add to history
    addToHistory(password);
    
    // حفظ كلمة المرور للمستخدم المسجل
    saveUserPassword(password);
}

// Calculate password strength (0-100)
function calculatePasswordStrength(password, length) {
    let strength = 0;

    // Length factor (max 40 points)
    strength += Math.min(length / 32 * 40, 40);

    // Character variety factor (max 60 points)
    let varietyScore = 0;
    if (/[A-Z]/.test(password)) varietyScore += 15;
    if (/[a-z]/.test(password)) varietyScore += 15;
    if (/[0-9]/.test(password)) varietyScore += 15;
    if (/[^A-Za-z0-9]/.test(password)) varietyScore += 15;

    strength += varietyScore;

    // Reduce score if password has repeating patterns
    const repeatingPatterns = (password.match(/(.)\1{2,}/g) || []).length;
    strength -= repeatingPatterns * 10;

    return Math.max(0, Math.min(100, strength));
}

// Update the strength indicator
function updateStrengthIndicator(strength) {
    strengthFill.style.width = `${strength}%`;

    // Set color based on strength
    if (strength < 30) {
        strengthFill.style.backgroundColor = "var(--light-red)";
        strengthValue.textContent = "ضعيفة";
        strengthValue.style.color = "var(--light-red)";
    } else if (strength < 70) {
        strengthFill.style.backgroundColor = "#ff9800";
        strengthValue.textContent = "متوسطة";
        strengthValue.style.color = "#ff9800";
    } else {
        strengthFill.style.backgroundColor = "var(--light-green)";
        strengthValue.textContent = "قوية";
        strengthValue.style.color = "var(--light-green)";
    }
}

// Add password to history
function addToHistory(password) {
    passwordHistory.unshift(password);

    // Keep only the last MAX_HISTORY passwords
    if (passwordHistory.length > MAX_HISTORY) {
        passwordHistory.pop();
    }

    // Update history display
    updateHistoryDisplay();

    // Save to sessionStorage
    savePasswordHistory();
}

// Update the history display
function updateHistoryDisplay() {
    historyList.innerHTML = '';

    passwordHistory.forEach((password, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        // إظهار جزء من كلمة المرور فقط مع إمكانية الكشف عنها
        const maskedPassword = password.substring(0, 3) + '•'.repeat(password.length - 3);
        historyItem.textContent = maskedPassword;
        historyItem.title = 'انقر للكشف عن كلمة المرور';

        // إضافة وظيفة الكشف عند النقر
        historyItem.addEventListener('click', function() {
            if (this.textContent === maskedPassword) {
                this.textContent = password;
                this.title = 'انقر لإخفاء كلمة المرور';
            } else {
                this.textContent = maskedPassword;
                this.title = 'انقر للكشف عن كلمة المرور';
            }
        });

        // إضافة زر النسخ
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy copy-history-icon';
        copyIcon.title = 'نسخ كلمة المرور';
        copyIcon.style.marginRight = '10px';
        copyIcon.style.cursor = 'pointer';

        copyIcon.addEventListener('click', function(e) {
            e.stopPropagation(); // منع الانتشار للنقر على العنصر الأب
            navigator.clipboard.writeText(password).then(() => {
                this.className = 'fas fa-check copy-history-icon';
                setTimeout(() => {
                    this.className = 'fas fa-copy copy-history-icon';
                }, 1500);
            });
        });

        historyItem.prepend(copyIcon);
        historyList.appendChild(historyItem);
    });
}

// Copy password to clipboard
function copyToClipboard() {
    const password = passwordDisplay.textContent;

    // Check if there's a valid password to copy
    if (!password || password.includes("انقر") || password.includes("الرجاء") || password.includes("لا توجد")) {
        alert("لم يتم إنشاء كلمة مرور بعد. الرجاء إنشاء كلمة مرور أولاً.");
        return;
    }

    // Use the Clipboard API
    navigator.clipboard.writeText(password).then(() => {
        // Visual feedback for copy action
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
        copyBtn.style.backgroundColor = "var(--dark-green)";

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = "";
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("فشل نسخ كلمة المرور إلى الحافظة");
    });
}

// Reset rules to default
function resetRules() {
    lengthSlider.value = 12;
    lengthValue.textContent = "12";
    lengthDisplay.textContent = "12";
    uppercaseCheckbox.checked = true;
    lowercaseCheckbox.checked = true;
    numbersCheckbox.checked = true;
    symbolsCheckbox.checked = false;
    similarCharsCheckbox.checked = false;
    ambiguousCharsCheckbox.checked = false;

    // Reset password display
    passwordDisplay.textContent = "انقر على 'إنشاء كلمة مرور' لإنشاء كلمة مرور آمنة";
    passwordDisplay.style.color = "";

    // Reset strength indicator
    updateStrengthIndicator(0);

    // Reset copy button if it was changed
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> نسخ كلمة المرور';
    copyBtn.style.backgroundColor = "";
}

// Event listeners
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);
resetBtn.addEventListener('click', resetRules);

// وظائف تسجيل الدخول والخروج
function handleSignIn(response) {
    const payload = jwt_decode(response.credential);
    
    // حفظ معلومات المستخدم
    userId = payload.sub;
    userName.textContent = payload.name;
    userAvatar.src = payload.picture;
    
    // تحديث واجهة المستخدم
    userInfo.style.display = 'flex';
    signInContainer.style.display = 'none';
    isSignedIn = true;
    
    // تحميل كلمات المرور المحفوظة
    loadUserPasswords();
}

function signOut() {
    isSignedIn = false;
    userId = null;
    userPasswords = [];
    
    // تحديث واجهة المستخدم
    userInfo.style.display = 'none';
    signInContainer.style.display = 'block';
    
    // إعادة تعيين السجل المحلي
    passwordHistory = [];
    updateHistoryDisplay();
}

// وظائف حفظ وتحميل كلمات المرور
function saveUserPassword(password) {
    if (!isSignedIn) return;
    
    // إضافة كلمة المرور إلى القائمة
    userPasswords.unshift({
        password: password,
        created: new Date().toISOString()
    });
    
    // الاحتفاظ بآخر 20 كلمة مرور فقط
    if (userPasswords.length > 20) {
        userPasswords.pop();
    }
    
    // حفظ في localStorage (في التطبيق الحقيقي، سيتم حفظها في قاعدة بيانات الخادم)
    localStorage.setItem(`userPasswords_${userId}`, JSON.stringify(userPasswords));
}

function loadUserPasswords() {
    if (!isSignedIn) return;
    
    // تحميل من localStorage (في التطبيق الحقيقي، سيتم تحميلها من قاعدة بيانات الخادم)
    const savedPasswords = localStorage.getItem(`userPasswords_${userId}`);
    if (savedPasswords) {
        userPasswords = JSON.parse(savedPasswords);
        
        // تحديث السجل المحلي
        passwordHistory = userPasswords.map(item => item.password);
        updateHistoryDisplay();
    }
}

// Initialize with a password on page load
window.addEventListener('DOMContentLoaded', () => {
    // Generate an initial password
    generatePassword();
    
    // تحسين تجربة المستخدم على الأجهزة المحمولة
    if (window.innerWidth <= 768) {
        // إضافة دعم للاستجابة للأحداث اللمسية
        document.querySelectorAll('button, .checkbox-label, .history-item').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
    
    // تحسين عرض كلمة المرور على الشاشات الصغيرة
    function adjustPasswordDisplay() {
        if (window.innerWidth <= 480) {
            const password = passwordDisplay.textContent;
            if (password.length > 15) {
                passwordDisplay.style.fontSize = '1rem';
            }
        }
    }
    
    // مراقبة تغيير حجم الشاشة
    window.addEventListener('resize', adjustPasswordDisplay);
    adjustPasswordDisplay();
});