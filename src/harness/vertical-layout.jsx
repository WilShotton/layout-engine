import First from './components/first'
import Second from './components/second'
import Third from './components/third'

export default {

    layout: 'vertical',

    children: [
        {
            factory: First
        }, {
            factory: Second
        }, {
            factory: Third
        }
    ]
}
