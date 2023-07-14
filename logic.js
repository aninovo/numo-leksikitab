class Dictionary {
    /**
     * @param {Array} entries - An array of entry objects
     */
    constructor(entries = []) {
        this.entries = entries;
        // prepare indices
        this.indexDirect = new Index();
        this.indexReverse = new Index();
        for (const entry of this.entries) {
            // add Numo -> entry
            let splitA = entry.Term.split(' ');
            if (splitA.length > 1)
            // add the whole phrase
                this.indexDirect.addPair(entry.Term, entry);
            for (const word of splitA) {
                this.indexDirect.addPair(word, entry);
            }
            // add English -> entry
            let splitB = entry.Translation.split(' ');
            if (splitB.length > 1)
                // add the whole phrase
                this.indexDirect.addPair(entry.Translation, entry);
            for (const word of splitB) {
                this.indexReverse.addPair(word, entry);
            }
        }
    }

    /**
     * 
     * @param {string} word - the word or phrase to look up
     */
    lookUp(word, direct=true, reverse=false) {
        let results = [];
        if (direct) {
            let lookupA = this.indexDirect.lookUp(word);
            if (lookupA != null)
                for (const entry of lookupA)
                    results.push([entry]);
        }
        if (reverse) {
            let lookupB = this.indexReverse.lookUp(word);
            if (lookupB != null)
                for (const entry of lookupB)
                    results.push([entry]);
        }
        return results;
    }

    /**
     * To perform a morphological analysis
     * @param {string} word - the word to analyze
     * @return {Array} List of analyses, each is an array of entries that form the given word together
     */
    analyze(word) {
        let analyses = [];
        function validateAnalysis(analysis) {
            // check that the word isn't said to begin with a suffix, or that a suffix directly follows a prefix, or that either is glued to a phrase or pornoun
            let prefixExpected = true;
            let suffixExpected = false;
            let rootFound = false;
            let pronounFound = false;
            for (const entry of analysis) {
                switch (entry.Class) {
                    case 'prefix':
                        if (!prefixExpected) return false;
                        prefixExpected = true;
                        suffixExpected = false;
                        break;
                    case 'suffix':
                        if (!suffixExpected) return false;
                        prefixExpected = true;
                        suffixExpected = true;
                        break;
                    case 'Noun':
                        prefixExpected = true;
                        suffixExpected = true;
                        rootFound = true;
                        break;
                    case 'Adjective':
                        prefixExpected = true;
                        suffixExpected = true;
                        rootFound = true;
                        break;
                    case 'Verb':
                        prefixExpected = true;
                        suffixExpected = true;
                        rootFound = true;
                    case 'Pronoun':
                        pronounFound = true;
                        break;
                    default:
                        break;
                }
            }
            if (analysis.length > 1 && !rootFound) return false; // no words made of just suffixes and prefixes
            if (analysis.length > 1 && pronounFound) return false; // no compounds with pronouns
            return true;
        }
        function analyzeRec(word, previousAnalysis, analyses, index) {
            for (let i = 1; i < word.length; i++) {
                let substr = word.slice(0, i);
                let lookup = index.lookUp(substr);
                if (lookup != null) {
                    for (const entry of lookup) {
                        let isSingleWord = (entry.Term == substr);
                        if (!isSingleWord) continue;
                        let analysis = previousAnalysis.slice();
                        analysis.push(entry);
                        analyzeRec(word.slice(i, word.length), analysis, analyses, index);
                    }
                }
            }
            let lookup = index.lookUp(word);
            if (lookup != null) {
                for (const entry of lookup) {
                    let isSingleWord = (entry.Term == word);
                    if (!isSingleWord) continue;
                    let analysis = previousAnalysis.slice();
                    analysis.push(entry);
                    if (validateAnalysis(analysis))
                        analyses.push(analysis);
                }
            }
        }
        analyzeRec(word, [], analyses, this.indexDirect);
        return analyses;
    }

}

class Index {
    constructor() {
        this.map = new Map();
    }

    addPair(key, value) {
        if (this.map.get(key) == null)
            this.map.set(key, []);
        this.map.get(key).push(value);
    }

    lookUp(key) {
        return this.map.get(key);
    }
}