import ApiRequest from './createRequest.js';

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function getClientLocale() {
    return (navigator && navigator.language) || 'ru-RU';
}

/**
 * Возвращает день недели в коротком формате и на выбранном языке
 * date - дата
 * */
function getWeekday( date=new Date(), locale=getClientLocale() ) {
    return date.toLocaleString( locale, { weekday: 'short' } );
}

/**
 * Склоняет слово "минута" в соответствии с
 * количественным числительным
 * quantity - количество минут
 * */
function pluralizeMinutes( quantity ) {
    const rusPluralize = new Intl.PluralRules('ru-RU');
    const pluralize = (quantity, ...nounCase) => {
        const result = rusPluralize.select(quantity);
        switch (result) {
            case 'one': return nounCase[0];
            case 'few': return nounCase[1];
            case 'many': return nounCase[2];
        }
    }
    return pluralize(quantity, 'минута', 'минуты', 'минут');
}

/**
 * Класс Cinema инкапсулирует логику главной страницы сайта
 * управляет календарём и расписанием фальмов
 * */
class Cinema {
    constructor() {
        // запоминаем дату на начало дня в формате timestamp
        this.date = new Date().setHours(0,0,0,0);
        this.calendar = document.querySelector('.page-nav');
        this.calendar.addEventListener('click', this.selectDay.bind(this));
        this.fillCalendar(this.date);

        this.movieContainer = document.querySelector('main');
        this.movieContainer.addEventListener('click', this.chooseSeance.bind(this));
        this.renderSchedule(this.date);
    }

    /**
     * С помощью ApiRequest.getSchedule получает с сервера
     * полную информацию о фильмах, залах и сеансах,
     * перерисовывает основное содержимое страницы (main)
     * timestamp - текущаяя дата в формате timestamp
     * сохраняет информацию о залах в сессионном хранилище
     * */
    renderSchedule( timestamp ) {
        timestamp = Math.floor( timestamp / 1000 ).toString();
        ApiRequest.getSchedule( (response) => {
            console.log(response);
            sessionStorage.setItem('halls', JSON.stringify( response.halls.result ));

            this.movieContainer.dataset.date = timestamp;
            let html = ''
            response.films.result.forEach(movie => html += this.getMovieHTML( movie, response ));
            this.movieContainer.innerHTML = html;
        } );
    }

    /**
     * Формирует HTML-код секции с полной информацией
     * о фильме, включая расписание сеансов
     * movie - объект c информацией о конкретном фильме
     * response - ответ сервера с данными по всем фильмам, залам, сеансам
     * */
    getMovieHTML( movie, response ) {
        const movieId = movie.film_id;
        const halls = response.halls.result
            // выбираем открытые залы, в которых есть сеансы на конкретный фильм
            .filter(item => item.hall_open === '1' && response.seances.result
                .some(el => el.seance_hallid === item.hall_id && el.seance_filmid === movieId))
            // на всякий случай сортируем залы по названию
            .sort( (a, b) => a.hall_name > b.hall_name );

        // в расписание добавляем только те фильмы, по которым нашли сеансы
        if (!halls || halls.length === 0) {
            return;
        }
        // console.log('Залы: ', halls);
        let html = `
            <section class="movie" data-film_id="${movieId}">
        `;
        html += this.getMovieInfoHTML( movie );
        halls.forEach(hall => html += this.getHallHTML( hall, movieId, response ));
        return html + `
            </section>`;
    }

    /**
     * Формирует HTML-код div-элемента с информации о фильме.
     * info - объект c информацией о фильме
     * */
    getMovieInfoHTML( info={} ) {
        const { film_poster: poster,
                film_name: name,
                film_description: description,
                film_duration: duration,
                film_origin: origin } = info;
        return `<div class="movie__info">
            <div class="movie__poster">
                <img class="movie__poster-image" alt="постер фильма" src="${ poster }">
            </div>
            <div class="movie__description">
                <h2 class="movie__title">${ name }</h2>
                <p class="movie__synopsis">${ description }</p>
                <p class="movie__data">
                    <span class="movie__data-duration">${ duration } ${ pluralizeMinutes( duration ) }</span>
                    <span class="movie__data-origin">${ origin }</span>
                </p>
            </div>
        </div>
        `;
    }

    /**
     * Формирует HTML-код div-элемента с расписанием
     * сеансов конкретного фильма в конкретном зале.
     * hall - объект c информацией о зале
     * movieId - id фильма
     * response - ответ сервера с данными по всем фильмам, залам, сеансам
     * */
    getHallHTML(  hall, movieId, response ) {
        const seances = response.seances.result
            .filter(item => item.seance_filmid === movieId && item.seance_hallid === hall.hall_id)
            // сортируем сеансы по времени начала
            .sort((a, b) => a.seance_time > b.seance_time);
        // console.log('Сеансы: ', seances);
        let html = `<div class="movie-seances__hall data-hall_id="${ hall.hall_id }">
        <h3 class="movie-seances__hall-title">${ hall.hall_name }</h3>
        <ul class="movie-seances__list">
        `;
        seances.forEach(seance => html += this.getSeanceHTML( seance, hall.hall_id, movieId ));
        return html + `</ul>
            </div>
        `;
    }

    /**
     * Формирует HTML-код одного сеанса
     * seance - объект c информацией о сеансе
     * hallId - id зала
     * movieId - id фильма
     * */
    getSeanceHTML( seance, hallId, movieId ) {
        const timestamp = parseInt(seance.seance_start) * 60 + parseInt(this.movieContainer.dataset.date);
        return `<li class="movie-seances__time-block" data-seance_id="${ seance.seance_id }">
            <a class="movie-seances__time ${ timestamp < Date.now()/1000 ? 'accepting-button-disabled' : ''}" 
        href="html/hall.html?movieId=${ movieId }&hallId=${ hallId }&seanceId=${ seance.seance_id }&timestamp=${ timestamp }"
        >${ seance.seance_time }</a>
        </li>
        `;
    }

    /**
     * Срабатывает при нажатии (выборе) сеанса
     * сохраняет данные сеанса: название фильма,
     * зал и время начала сеанса в Session Storage
     * */
    chooseSeance( event ) {
        if (event.target.classList.contains('movie-seances__time')) {
            const info = {
                movieName: event.target.closest('.movie')
                    .querySelector('.movie__title').textContent,
                seanceTime: event.target.textContent,
                hallName: event.target.closest('.movie-seances__hall')
                    .querySelector('.movie-seances__hall-title').textContent,
            };
            sessionStorage.setItem('info', JSON.stringify( info ));
        }
    }

    /**
     * Отслеживает нажатие на панель календаря
     * если пользователь выбрал другой (не выбранный в настоящий момент) день
     * то переносит класс page-nav__day_chosen
     * и вызывает перерисовку страницы с расписанием
     * */
    selectDay( event ) {
        event.preventDefault();
        const previousChosenDay = this.calendar.querySelector('.page-nav__day_chosen');
        const newChosenDay = event.target.closest('.page-nav__day');
        if (newChosenDay && newChosenDay!==previousChosenDay) {
            previousChosenDay?.classList.remove('page-nav__day_chosen');
            newChosenDay.classList.add('page-nav__day_chosen');

            this.renderSchedule( newChosenDay.dataset.date * 1000 );
        }
    }

    /**
     * Заполняет календарь в навигационной панели для посмотра расписания сеансов
     * timestamp - дата в формате timestamp, по умолчанию - сегодня
     * */
    fillCalendar( timestamp=Date.now() ) {
        this.calendar.innerHTML = this.getCalendarHTML( this.getDaysArray( new Date( timestamp ) ) );
    }

    /**
     * Формирует массив дней для последующей отрисовки календаря
     * currentDay - первый день, с которого начинается календарь, по умолчанию - сегодня,
     * number - количество дней, отображаемых в панеле календаря
     * todayInd - индекс сегодняшнего дня, по умолчанию - начальный
     * chosenInd - индекс выбранного дня, по умолчанию - начальный
     * */
    getDaysArray( currentDay=new Date(), number=6, todayInd=0, chosenInd=0 ) {
        const days = [];
        for (let ind = 0; ind < number; ind += 1) {
            const day = {
                weekday: getWeekday( currentDay ).capitalize(),
                monthDay: currentDay.getDate(),
                isToday: ind === todayInd,
                isChosen: ind === chosenInd,
                timestamp: currentDay.setHours(0, 0, 0, 0),
            };
            days.push( day );
            // прибавляем один день
            currentDay.setDate( currentDay.getDate() + 1 );
        }
        return days;
    }

    /**
     * Формирует HTML-код одного дня в календаре.
     * day - объект вида { weekday, day, isToday, isChosen, timestamp }
     * */
    getDayHTML( day={} ) {
        return `<a class="page-nav__day 
                ${day.isToday ? 'page-nav__day_today' : ''} 
                ${day.isChosen ? 'page-nav__day_chosen' : ''} 
                ${day.weekday === 'Сб' || day.weekday === 'Вс' ? 'page-nav__day_weekend' : ''}
                " href="#" data-date="${ Math.floor(day.timestamp / 1000).toString() }">
                    <span class="page-nav__day-week">${day.weekday}</span>
                    <span class="page-nav__day-number">${day.monthDay}</span>
                </a>`;
    }

    /**
     * Формирует HTML-код всего календаря.
     * days - массив объектов вида { weekday, day, isToday, isChosen, timestamp }
     * для каждого элемента массива вызывает функцию getDayHTML
     * */
    getCalendarHTML( days=[] ) {
        return days.reduce((acc, item) => acc += this.getDayHTML( item ), '');
    }
}

const schedule = new Cinema();


