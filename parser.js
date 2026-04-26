function splitTitle(title) {
    const [ titleCutted, siteName ] = title.split('—').map(item => item.trim());
    return titleCutted;
}

function getMetaInfo() {
    const html = document.documentElement;
    const language = html.getAttribute('lang');

    const title = splitTitle(html.querySelector('title').textContent);

    const keywords = html.querySelector('meta[name="keywords"]').getAttribute('content').split(',').map(item => item.trim());

    const description = html.querySelector('meta[name="description"]').getAttribute('content');

    const opengraph = {};
    const opengraphMetaArray = html.querySelectorAll('meta[property^="og:"]');
    opengraphMetaArray.forEach(opengraphMetaTag => {
        const [ propertyOg, propertyName ] = opengraphMetaTag.getAttribute('property').split(':');
        if (propertyName === 'title') {
            opengraph[propertyName] = splitTitle(opengraphMetaTag.getAttribute('content'));
        } else {
            opengraph[propertyName] = opengraphMetaTag.getAttribute('content');
        }
    })

    return {
        language,
        title,
        keywords,
        description,
        opengraph
    }; 
}

function createImageObject(preview, full, alt) {
    return {
        preview,
        full,
        alt
    }
}

function getSumWithoutCurrency(priceWithCurrency) {
    return Number(priceWithCurrency.slice(1));
}

function getCurrencyName(priceWithCurrency) {
    const currencySymbol = priceWithCurrency[0];
    let currency = '';
    switch (currencySymbol) {
        case '$':
            currency = 'USD';
            break;
        
        case '€':
            currency = 'EUR';
            break;

        default:
            currency = 'RUB';
            break;
    }
    return currency;
}

function getProductInfo() {
    const html = document.documentElement;
    const id = html.querySelector('.product').dataset.id;

    const images = [];
    const allImages = html.querySelectorAll('nav button img');
    allImages.forEach(image => {
            images.push(createImageObject(
        image.getAttribute('src'),
        image.dataset.src,
        image.getAttribute('alt')
        ));
    })

    const isLiked = html.querySelector('.like').classList.contains('active');

    const name = html.querySelector('h1').textContent;

    const tags = {
        category: [],
        label: [],
        discount: []
    };
    const allTags = html.querySelectorAll('.tags span');
    allTags.forEach(tag => {
        const text = tag.textContent.trim();

        if (tag.className === 'green') {
            tags.category.push(text);
        } else if (tag.className === 'blue') {
            tags.label.push(text);
        } else if (tag.className === 'red') {
            tags.discount.push(text)
        }
    })

    const priceBlock = html.querySelector('.price');
    const priceBlockClone = priceBlock.cloneNode(true);
    let oldPrice = 0;
    let discount = 0;
    const isOldPriceExist = (priceBlockClone.querySelector('span') !== null);
    if (isOldPriceExist) {
        const oldPriceWithCurrency = priceBlockClone.querySelector('span').textContent.trim();
        priceBlockClone.querySelector('span').replaceWith('');
        oldPrice = getSumWithoutCurrency(oldPriceWithCurrency);
    }

    const priceWithCurrency = priceBlockClone.textContent.trim();
    const price = getSumWithoutCurrency(priceWithCurrency);

    if (isOldPriceExist) {
        discount = oldPrice - price;
    }
    let discountPercent = 0;
    if (discount !== 0) {
        discountPercent = (discount / oldPrice * 100).toFixed(2);
    }
    discountPercent = `${discountPercent}%`;

    const currency = getCurrencyName(priceWithCurrency);

    const values = html.querySelectorAll('.properties li');
    const properties = {};
    values.forEach( value => {
        let key = value.querySelector('span:nth-child(1)').textContent;
        properties[key] = value.querySelector('span:nth-child(2)').textContent;
    })

    const descriptionFull = html.querySelector('.description');
    const descriptionFullClone = descriptionFull.cloneNode(true); // Создаем клон для неприкосновенности сайта
    const descriptionFullTags = descriptionFullClone.querySelectorAll('*');
    descriptionFullTags.forEach(descriptionTags => {
        descriptionTags.getAttributeNames().forEach(descriptionTag => {
            descriptionTags.removeAttribute(descriptionTag);
        })
    })
    const description = descriptionFullClone.innerHTML.trim();

    return {
        id,
        name,
        isLiked,
        tags,
        price,
        oldPrice,
        discount,
        discountPercent,
        currency,
        properties,
        description,
        images
    };
}

function getSuggestedInfo() {
    const html = document.documentElement;
    const suggested = [];
    const suggestedAll = html.querySelectorAll('.suggested article');
    suggestedAll.forEach(suggest => {
        const price = suggest.querySelector('b').textContent.trim();
        suggested.push({
            name: suggest.querySelector('h3').textContent.trim(),
            description: suggest.querySelector('p').textContent.trim(),
            image: suggest.querySelector('img').getAttribute('src'),
            price: String(getSumWithoutCurrency(price)),
            currency: getCurrencyName(price)
        })
    })

    return suggested;
}

// Альтернативное решение с .map()
//
// function getSuggestedInfo() {
//     const html = document.documentElement;
    
//     // Получаем NodeList карточек
//     const suggestedAll = html.querySelectorAll('.suggested article');
    
//     // Array.from превращает NodeList в настоящий массив, чтобы мы могли использовать .map()
//     // .map() сам создаст и вернет новый массив из того, что мы вернем внутри него
//     const suggested = Array.from(suggestedAll).map(suggest => {
//         // 1. Сохраняем цену в переменную (один поход в DOM!)
//         const priceText = suggest.querySelector('b').textContent.trim();
        
//         // 2. Сразу возвращаем готовый объект (без лишних функций-фабрик)
//         return {
//             name: suggest.querySelector('h3').textContent.trim(),
//             description: suggest.querySelector('p').textContent.trim(),
//             image: suggest.querySelector('img').getAttribute('src'),
//             price: getSumWithoutCurrency(priceText),
//             currency: getCurrencyName(priceText)
//         };
//     });

//     return suggested;
// }

function getReviewInfo() {
    const html = document.documentElement;
    const reviewAll = html.querySelectorAll('.reviews article');

    const reviews = Array.from(reviewAll).map(review => {
        const rating = review.querySelectorAll('.rating span.filled').length;

        const authorBlock = review.querySelector('.author');
        const author = {
            avatar: authorBlock.querySelector('img').getAttribute('src'),
            name: authorBlock.querySelector('span').textContent.trim()
        }

        const title = review.querySelector('.title').textContent.trim();

        const description = review.querySelector('p').textContent.trim();

        const dateText = review.querySelector('.author i').textContent.trim();
        const [ day, month, year ] = dateText.split('/');
        const date = `${day}.${month}.${year}`

        return {
            rating,
            author,
            title,
            description,
            date
        }
    })

    return reviews;
}

function parsePage() {
    return {
        meta: getMetaInfo(),
        product: getProductInfo(),
        suggested: getSuggestedInfo(),
        reviews: getReviewInfo()
    };
}

window.parsePage = parsePage;