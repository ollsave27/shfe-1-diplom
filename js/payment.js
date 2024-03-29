import ApiRequest from './createRequest.js';

/**
 * Класс Payment инкапсулирует логику страницы payment.html
 * сообщает серверу о бронировании
 * */
class Payment {
    constructor() {
        this.urlSearsh = new URL(location.href).searchParams;
        this.payBtn = document.querySelector('.accepting-button');
        this.payBtn.addEventListener('click', this.reserveTickets.bind(this));
        this.setBuyingInfo();
    }

    /**
     * Извлекает из Session Storage данные заказа:
     * выводит на страницу информацию о сеансе,
     * выбранных местах и стоимости билетов
     * */
    setBuyingInfo() {
        const container = document.querySelector('.ticket__info-wrapper');
        const { movieName, seanceTime, hallName } = JSON.parse(sessionStorage.getItem( 'info' ));
        container.querySelector('.ticket__title').textContent = movieName;
        container.querySelector('.ticket__hall').textContent = hallName;
        container.querySelector('.ticket__start').textContent = seanceTime
            + ', ' + new Date(this.urlSearsh.get('timestamp')*1000).toLocaleDateString();

        container.querySelector('.ticket__chairs')
            .textContent = sessionStorage.getItem( 'chosenSeats' );

        container.querySelector('.ticket__cost')
            .textContent = sessionStorage.getItem( 'totalPrice' );
    }

    /**
     * Отслеживает нажатие на кнопку "Получить код бронирования"
     * Использует ApiRequest.getTickets, чтобы
     * сообщить серверу о новом бронировании
     * */
    reserveTickets() {
        location.href=`ticket.html?${ this.urlSearsh.toString() }`;
        ApiRequest.getTickets({
            timestamp: this.urlSearsh.get('timestamp'),
            hallId: this.urlSearsh.get('hallId'),
            seanceId: this.urlSearsh.get('seanceId'),
            hallConfiguration: sessionStorage.getItem('hallConfiguration'),
        }, (( response ) => {
            console.log(response);
        }));
    }
}

const payPage = new Payment();