import First from './components/first'
import Second from './components/second'
import Third from './components/third'

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
