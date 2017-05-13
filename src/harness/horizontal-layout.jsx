import First from './components/first'
import Second from './components/second'
import Third from './components/third'

export default {

    layout: 'horizontal',

    children: [
        {
            factory: First,
            props: {className: 'horizontal'},
            measure: 60
        }, {
            factory: Second,
            props: {className: 'horizontal'}
        }, {
            factory: Third,
            props: {className: 'horizontal'}
        }
    ]
}
