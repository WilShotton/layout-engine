import Bottom from './components/bottom'
import Middle from './components/middle'
import Top from './components/top'

export default {

    layout: 'vertical',

    children: [
        {factory: Top},
        {factory: Middle},
        {factory: Bottom}
    ]
}
