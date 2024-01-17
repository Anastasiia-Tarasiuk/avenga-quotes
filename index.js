const api_url ="https://zenquotes.io/api/random/";
const quoteEl = document.querySelector('.quote');
const quoteContainerEl = document.querySelector('.quote-container');
const listEl = document.querySelector('.list');
const pagesEl = document.querySelector('.pages');
const moreButton = document.querySelector('.more');
const seeButton = document.querySelector('.see');
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const closeModalButton = document.querySelector(".close-modal");

moreButton.addEventListener('click', getMoreInspiration);
seeButton.addEventListener('click', seeAllQuotes);
pagesEl.addEventListener('click', paginate);
closeModalButton.addEventListener('click', e => toggleModal(e));
overlay.addEventListener('click',  e => toggleModal(e));

let quotesArray = [];
let numberOfPages = null;
const NUMBER = 5;
let isListShown = false;
let currentPage = null;
let storageId = null;
let isModalOpened = null;

getAPI(api_url);

function getAPI(url){
    listEl.innerHTML = ""; 
    pagesEl.innerHTML = "";
    isListShown = false;

    storageId = Date.now();
    const prevRaiting = document.querySelector(".rating");

    if (prevRaiting) {
        prevRaiting.remove();
    }
    
    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error: ${res.status}`);
            }
            return res.json();
        })
        .then(res => {
            quoteEl.textContent = res[0].q;
            const rating = createRating();
            rating.addEventListener("click", (e) => saveRating(e, storageId));
            quoteEl.after(rating);

            const storageItem = JSON.stringify({item: res[0].q, value:0});
            localStorage.setItem(storageId, storageItem);
        }).catch( err => {
            console.error(err)
        })
}

function getMoreInspiration(){
    getAPI(api_url);
}

function seeAllQuotes(){
    isListShown = true;
    
    if (listEl.innerHTML.length > 0) {
        listEl.innerHTML = "";
        pagesEl.innerHTML = "";
        
    }

    const length = localStorage.length;

    if (length > 0) {
        numberOfPages = length % NUMBER !== 0 ? Math.trunc(length / NUMBER) + 1 : Math.trunc(length / NUMBER);
        quotesArray = [];

        for (let i = 0; i < length; i++) {
            const key = localStorage.key(i);
            const quote = JSON.parse(localStorage.getItem(key));

            quotesArray.push(`<li><p data-id=${key} data-value=${quote.value}>${quote.item}</p></li>`);

            if (i < NUMBER) {
                listEl.insertAdjacentHTML("beforeend", quotesArray[i]);
                setIcon(listEl.lastChild.querySelector('p'));
            }
        }
        
        for (let j = 0; j < numberOfPages; j++) {
            pagesEl.insertAdjacentHTML("beforeend", `<button id=${j} class=${j===0? "active" : ""}>${j+1}</button>`);
        } 

        currentPage = 1;
    } else {
        listEl.innerHTML = `<li><p>No quotes yet</p></li>`;
    }
}

function paginate(e){
    if (e.target.nodeName !== "BUTTON") {
        return;
    } 

    if (currentPage === e.target.getAttribute('id')) {
        return;
    }

    currentPage = e.target.getAttribute('id');
    const quotesOfCurrentPage = quotesArray.slice(currentPage*NUMBER, currentPage*NUMBER+NUMBER);

    listEl.innerHTML = "";

    for (let i = 0; i < quotesOfCurrentPage.length; i++) {
        listEl.insertAdjacentHTML("beforeend", quotesOfCurrentPage[i]);
        setIcon(listEl.lastChild.querySelector('p'));
    }

    [...e.currentTarget.children].forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");
}

function saveRating(e, id){
    e.stopPropagation();
    if (e.target.nodeName !== "INPUT") {
        return;
    } 

    [...e.currentTarget.children].forEach(el => el.classList.add('rated'));

    const ratedItem = JSON.parse(localStorage.getItem(id));
    ratedItem.value = e.target.value;
    localStorage.setItem(id, JSON.stringify(ratedItem));

    if (isListShown) {
        if (isCurrentQuoteShown()) {
            if (!e.target.parentElement.classList.contains("modal-rating")) {
                changeRatedValue(e, storageId);
            } else {
                changeRatedValue(e, id);

                if (Number(id) === storageId) {
                    colorStars(0, e.target.value);
                }
            }
        } else {
            if (e.target.parentElement.classList.contains("modal-rating")) {
                changeRatedValue(e, id);
            }
        }
    }

    if (quotesArray.length > 0) {
        quotesArray.forEach((el, idx) => {
            if (el.includes(id)) {
                const changedItem = `<li><p data-id=${id} data-value=${e.target.value}>${JSON.parse(localStorage.getItem(id)).item}</p></li>`;
                quotesArray.splice(idx, 1, changedItem);
            }
        })
    }
}

function setIcon(el){
    if (el.parentElement.querySelector("button")) {
        el.parentElement.querySelector("button").remove();
    }

    if (el.parentElement.querySelector(".tooltip-container")) {
        el.parentElement.querySelector(".tooltip-container").remove();
    }

    const modalButton = document.createElement('button');
    modalButton.classList.add('modal-button');

    const id = el.parentElement.querySelector('p').dataset.id;

    modalButton.addEventListener("click", e => toggleModal(e, id));

    const tooltipContainer = document.createElement('div');
    tooltipContainer.classList.add('tooltip-container');

    const image = document.createElement('img');
    image.style.height = "24px";

    tooltipContainer.appendChild(image);
    el.before(modalButton);
    modalButton.after(tooltipContainer);

    switch (el.dataset.value){
        case "1": 
            modalButton.classList.add("one-star");
            image.setAttribute('src', "/images/one.png");
            break;
        case "2": 
            modalButton.classList.add("two-star");
            image.setAttribute('src', "/images/two.png");
            break;
        case "3": 
            modalButton.classList.add("three-star");
            image.setAttribute('src', "/images/three.png");
            break;
        case "4": 
            modalButton.classList.add("four-star");
            image.setAttribute('src', "/images/four.png");
            break;
        case "5": 
            modalButton.classList.add("five-star");
            image.setAttribute('src', "/images/five.png");
            break;
        default:
            modalButton.classList.add("default");
            image.setAttribute('src', "/images/default.png");
    }
}

function isCurrentQuoteShown() {
    const quotesIdOnPage = [...listEl.children].map(el => Number(el.querySelector("p").dataset.id));
    return quotesIdOnPage.includes(storageId) ? true : false;
}

function toggleModal(e, id){
    e.stopPropagation();

    if (overlay.classList.contains("is-shown")) {
        overlay.classList.remove("is-shown");
        overlay.classList.add("is-hidden");
        isModalOpened = false;
    } else {
        overlay.classList.add("is-shown");
        overlay.classList.remove("is-hidden");
        isModalOpened = true;
        setModalContent(id);
    }
}

function createRating({element = "quoteBlock"}={}){
    const rating = document.createElement("div");
    rating.classList.add("rating"); 

    for (let i = 0; i < 5; i++) {
        const star =  document.createElement("input");
        star.setAttribute("type", "radio");
        star.setAttribute("name", `star${element}`);
        star.setAttribute("value", `${i+1}`);
        star.setAttribute("id", `star${i+1+element}`);
        const label =  document.createElement("label");
        label.setAttribute("for", `star${i+1+element}`);
        rating.appendChild(star);
        rating.appendChild(label);
    }

    return rating;
}

function setModalContent(id) {
    const value = JSON.parse(localStorage.getItem(id)).value;

    if (closeModalButton.nextElementSibling) {
        document.querySelector(".modal-rating").remove();
        closeModalButton.nextElementSibling.remove();
    }

    const modalQuote = document.createElement("p");
    modalQuote.innerHTML = JSON.parse(localStorage.getItem(id)).item;
    modalQuote.classList.add("modal-quote");
    
    const modalRating = createRating({element: "modalBlock"});
    modalRating.classList.add("modal-rating"); 

    modalRating.addEventListener("click", (e) => saveRating(e, id));
    modal.appendChild(modalQuote);
    modal.appendChild(modalRating);

    colorStars(1, value);
}

function changeRatedValue(e, id){
    const quoteRaitingToChange = document.querySelector(`[data-id="${id}"]`);
    quoteRaitingToChange.setAttribute("data-value", e.target.value);
    setIcon(quoteRaitingToChange);
}

function colorStars(num, value) {
    [...document.querySelectorAll(".rating")[num].children].forEach((el, idx) => {
        el.classList.remove('rated');
        if (idx % 2 === 0) {
            if (el.getAttribute("value") <= value) {
                el.classList.add('rated');
            }
        }
        
    })
}