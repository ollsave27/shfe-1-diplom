import QrCreator from './src/qr-creator.js';

/**
 * Класс Ticket инкапсулирует логику страницы ticket.html
 * формирует QR-код брони
 * */
class Ticket {
    constructor() {
        this.urlSearsh = new URL(location.href).searchParams;
        // подготавливаем контейнер для QR-кода
        document.querySelector('.ticket__info-qr').outerHTML = '<div class="ticket__info-qr"></div>';

        this.setBuyingInfo();
    }

    /**
     * Извлекает из Session Storage информацию
     * о сеансе и выбранных местах, заполняет
     * соответствующий раздел страницы.
     * Использует QrCreator
     * */
    setBuyingInfo() {
        const container = document.querySelector('.ticket__info-wrapper');
        let { movieName, seanceTime, hallName } = JSON.parse(sessionStorage.getItem( 'info' ));
        seanceTime += ', ' + new Date(this.urlSearsh.get('timestamp')*1000).toLocaleDateString();
        container.querySelector('.ticket__title').textContent = movieName;
        container.querySelector('.ticket__hall').textContent = hallName;
        container.querySelector('.ticket__start').textContent = seanceTime

        const seats = sessionStorage.getItem( 'chosenSeats' );
        container.querySelector('.ticket__chairs').textContent = seats;

        const qrText = `Фильм: ${ movieName }\nРяд/Место: ${ seats }, ${ hallName }\nНачало сеанса: ${ seanceTime }\nБилет действителен строго на свой сеанс.`;

        QrCreator.render({
            text: qrText,
            radius: 0.4, // 0.0 to 0.5
            ecLevel: 'L', // L, M, Q, H
            fill: '#C76F00', // foreground color
            background: null, // color or null for transparent
            size: 192 // in pixels
        }, document.querySelector('.ticket__info-qr'));
    }
}

const ticket = new Ticket();