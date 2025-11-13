#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <algorithm>
#include <regex>
#include <unordered_set>
#include <iomanip>

using namespace std;

class PasswordCriterion {
protected:

    string name;
    int scoreValue;

public:
    PasswordCriterion(const string& name, int scoreValue) : name(name), scoreValue(scoreValue) {}
    virtual ~PasswordCriterion() = default;

    struct Result {
        bool met;
        string message;
        int score;
    };
    virtual Result check(const string& password) const = 0;

    // Getter for display
    string getName() const { return name; }
};


class LengthCriterion : public PasswordCriterion {
public:
    LengthCriterion() : PasswordCriterion("Minimum Length (8 characters)", 25) {}

    Result check(const string& password) const override {
        const int minLength = 8;
        bool isMet = password.length() >= minLength;
        string message = isMet
            ? "Great! Password is 8+ characters long."
            : "Needs " + to_string(minLength - password.length()) + " more character(s).";

        return { isMet, message, isMet ? scoreValue : 0 };
    }
};

class TypeCriterion : public PasswordCriterion {
public:
    TypeCriterion() : PasswordCriterion("Character Complexity (4 types)", 50) {}

    Result check(const string& password) const override {

        bool hasUpper = false;
        bool hasLower = false;
        bool hasDigit = false;
        bool hasSpecial = false;


        for (char c : password) {
            if (isupper(c)) hasUpper = true;
            else if (islower(c)) hasLower = true;
            else if (isdigit(c)) hasDigit = true;
            else if (string("!@#$%^&*()-+={}[]|\\:;\"'<>,.?/`~").find(c) != string::npos) hasSpecial = true;
        }

        int typesMet = hasUpper + hasLower + hasDigit + hasSpecial;
        bool isMet = typesMet == 4;

        string message = "Excellent! All 4 character types are present.";
        if (!isMet) {
            vector<string> missing;
            if (!hasUpper) missing.push_back("Uppercase");
            if (!hasLower) missing.push_back("Lowercase");
            if (!hasDigit) missing.push_back("Digit");
            if (!hasSpecial) missing.push_back("Special Char");

            message = "Missing: ";
            for (size_t i = 0; i < missing.size(); ++i) {
                message += missing[i] + (i < missing.size() - 1 ? ", " : ".");
            }
        }
        
        int awardedScore = floor(scoreValue * (static_cast<double>(typesMet) / 4.0));
        return { isMet, message, awardedScore };
    }
};


class RepetitionCriterion : public PasswordCriterion {
public:
    RepetitionCriterion() : PasswordCriterion("No Repetitive Sequences (AAA)", 15) {}

    Result check(const string& password) const override {

        const regex repetitionRegex(R"((.)\1\1)");
        bool isWeak = regex_search(password, repetitionRegex);
        bool isMet = !isWeak;

        string message = isMet
            ? "No obvious triple repetitions found."
            : "Warning: Contains three or more identical characters in a row (e.g., 'aaa').";

        return { isMet, message, isMet ? scoreValue : 0 };
    }
};

class DictionaryCriterion : public PasswordCriterion {
private:
    
    const unordered_set<string> weakList = {
        "password", "123456", "qwerty", "admin", "qazwsx", "12345678", "abc", "god", "user", "access"
    };

public:
    DictionaryCriterion() : PasswordCriterion("Not a Common Word/Pattern", 10) {}

    Result check(const string& password) const override {
      
        string lowerPassword = password;
        transform(lowerPassword.begin(), lowerPassword.end(), lowerPassword.begin(), ::tolower);

        bool isWeak = false;
        for (const string& weak : weakList) {
            if (lowerPassword.find(weak) != string::npos) {
                isWeak = true;
                break;
            }
        }
        
        bool isMet = !isWeak;
        string message = isMet
            ? "Password does not contain common dictionary words."
            : "Warning: Contains a common or dictionary word/sequence.";

        return { isMet, message, isMet ? scoreValue : 0 };
    }
};


class PasswordChecker {
private:
    vector<unique_ptr<PasswordCriterion>> criteria;

public:
    PasswordChecker() {
        criteria.push_back(make_unique<LengthCriterion>());
        criteria.push_back(make_unique<TypeCriterion>());
        criteria.push_back(make_unique<RepetitionCriterion>());
        criteria.push_back(make_unique<DictionaryCriterion>());
    }

    struct FullResult {
        int score;
        vector<PasswordCriterion::Result> results;
    };

    FullResult check(const string& password) const {
        if (password.empty()) {
            return { 0, {} };
        }

        int totalScore = 0;
        vector<PasswordCriterion::Result> results;

        for (const auto& criterion : criteria) {
            auto result = criterion->check(password);
            totalScore += result.score;
            results.push_back(result);
        }

        return { min(totalScore, 100), results };
    }

    const vector<unique_ptr<PasswordCriterion>>& getCriteria() const {
        return criteria;
    }
};

int main() {
    cout << "--- C++ Password Strength Analyzer (OOP & DSA Demo) ---" << endl;
    cout << "Enter your password: ";
    string password;
    getline(cin, password);

    if (password.empty()) {
        cout << "No password entered." << endl;
        return 0;
    }

    PasswordChecker checker;
    PasswordChecker::FullResult analysis = checker.check(password);

    cout << "\n------------------------------------------------------" << endl;
    cout << "Strength Score: " << analysis.score << "/100" << endl;
    cout << "Evaluation Criteria:" << endl;
    cout << "------------------------------------------------------" << endl;

    for (size_t i = 0; i < analysis.results.size(); ++i) {
        const auto& result = analysis.results[i];
        const string& name = checker.getCriteria()[i]->getName();

        cout << (result.met ? "  [PASS] " : "  [FAIL] ");
        cout << setw(30) << left << name << " | ";
        cout << result.message << endl;
    }

    cout << "------------------------------------------------------" << endl;
    return 0;
}