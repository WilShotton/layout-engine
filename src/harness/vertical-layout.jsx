import First from './components/first'
import Second from './components/second'
import Third from './components/third'


const layout = {

    factory: 'HorizontalLayout',

    children: [

        {
            factory: 'Navigation',
            measure: 60,

        }, {

            factory: 'VerticalLayout',

            children: [
                {

                    factory: 'Header',
                    measure: 60

                }, {

                    factory: 'RoutedLayout',

                    children: [

                        {
                            factory: 'First'
                        }, {
                            factory: 'Second'
                        }, {
                            factory: 'Third'
                        }
                    ]

                }, {

                    factory: 'Footer',
                    measure: 60
                }
            ]
        }
    ]
}

export default {

    layout: 'vertical',

    children: [
        {
            factory: First,
            props: {className: 'vertical'}
        }, {
            factory: Second,
            props: {className: 'vertical'}
        }, {
            factory: Third,
            props: {className: 'vertical'}
        }
    ]
}
