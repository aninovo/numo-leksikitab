/**
 * Entry point
 */
function prepare() {
    window.dictionary = new Dictionary($.csv.toObjects(csvData));
    $('#search-bar').on('submit', onSubmit);
}

function onSubmit() {
    let query = $('#search-box').val();
    if (query == "")
        return false;
    let words = query.split(' ');
    let results = [];
    if (words.length == 1) {
        // analyze one word
        let resultsA = window.dictionary.analyze(query);
        results = resultsA;
        let lowercase = query.toLowerCase()
        if (lowercase != query) {
            let resultsB = window.dictionary.analyze(lowercase);
            results = results.concat(resultsB);
            query = lowercase; // it's easier to work with lower case
        }
        const regex_te = /te$/;
        if (regex_te.test(query)) {
            // remove the past tense suffix and analyze (accept only verbs)
            let stem = query.replace(regex_te, '');
            let resultsC = window.dictionary.analyze(stem);
            resultsC = resultsC.filter(analysis => analysis.length > 0 && analysis[analysis.length - 1].Class == 'Verb');
            results = results.concat(resultsC);
        }
    }
    if (words.length > 1 || results.length == 0) {
        results = results.concat(window.dictionary.lookUp(query));
        // look up phrases and individual words, also in the other language
        for (const word of words) {

            results = results.concat(window.dictionary.lookUp(word));
        }
        // filter out duplicates
        results = results.filter(function (item, pos) {
            return results.indexOf(item) == pos;
        });
    }
    formatResults(results);

    return false
}

function formatResults(results) {
    $('main').html('');
    if (results.length == 0) {
        // message - nothing found
    }
    else {
        for (const block of results) {
            let divBlock = document.createElement('div');
            $(divBlock).addClass('result');
            $('main').append(divBlock);
            let first = true;
            for (const entry of block) {
                let divHeadword = document.createElement('div');
                $(divHeadword).addClass('headword');
                if (first)
                    $(divHeadword).html(entry.Term);
                else
                    $(divHeadword).html('+' + entry.Term);

                let divClass = document.createElement('div');
                $(divClass).addClass('word-class');
                $(divClass).html(entry.Class);

                let divTranslation = document.createElement('div');
                $(divTranslation).addClass('translation');
                $(divTranslation).html(entry.Translation);

                let divEntry = document.createElement('div');
                $(divEntry).addClass('entry');
                $(divEntry).append(divHeadword);
                $(divEntry).append(divClass);
                $(divEntry).append(divTranslation);

                first = false;
                $(divBlock).append(divEntry);
            }
        }
    }
}

$(document).ready(prepare);