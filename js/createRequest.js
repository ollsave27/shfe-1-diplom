/**
 * Класс инкапсулирует логику запросов на сервер.
 * */
export default class ApiRequest {
    static ULR = 'https://jscp-diplom.netoserver.ru/';
    static options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    /**
     * Получает от сервера расписание сеансов
     * callback - функция, выполняемая после запроса
     * */
    static getSchedule( callback = f => f ) {
        const init = this.bodyMaker('event=update');
        fetch( this.ULR, init )
            .then(response => response.json())
            .then(result => callback(result))
            .catch(error => {
                console.warn(error);
                alert('Не получилось обновить расписание. Попробуйте ещё раз.');
            });
    }

    /**
     * Получает от сервера инфомацию о
     * ранее забронированных местах
     * data - объект вида { timestamp, hallId, seanceId }
     * callback - функция, выполняемая после запроса
     * */
    static getSeats( data={}, callback = f => f ) {
        const init = this.bodyMaker('event=get_hallConfig', data);
        fetch( this.ULR, init )
            .then(response => response.json())
            .then(result => callback(result))
            .catch(error => {
                console.warn(error);
                alert('Обновите страницу, чтобы увидеть занятые места.');
            });
    }

    /**
     * Передаёт на сервер инфомацию о забронированных местах
     * data - объект вида { timestamp, hallId, seanceId, hallConfiguration }
     * callback - функция, выполняемая после запроса
     * */
    static getTickets( data={}, callback = f => f ) {
        const init = this.bodyMaker('event=sale_add', data);
        fetch( this.ULR, init )
            .then(response => response.json())
            .then(result => callback(result))
            .catch(error => {
                console.warn(error);
                alert('Произошёл сбой! Повторите попытку бронирования.');
            });
    }

    /**
     * Подготавливает данные для метода fetch
     * event - отличительный признак запроса
     * data - полезные данные
     * */
    static bodyMaker( event='', data={} ) {
        // console.log(event, data);
        let body = event;
        try {
            for (let key in data) {
                body += `&${ key }=${ data[key] }`;
            }
        } catch (e) {
            console.warn('Недопустимый формат данных! ', e);
        }
        // console.log(body);
        return Object.assign( { body }, this.options );
    }
}
