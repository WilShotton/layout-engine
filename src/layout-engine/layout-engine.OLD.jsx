import _ from 'lodash'
import Rx from 'rxjs/rx'


const tick$ = Rx.Observable.interval(10, Rx.Scheduler.animationFrame)
    .map(() => {

        return {
            width: window.innerWidth >> 1,
            height: window.innerHeight >> 1
        }
    })
    .distinctUntilChanged(_.isEqual)

    .do(v => console.log('tick$', v))

// tick$.subscribe(_.identity)


export default ({

    // bounds$ = CUI.utils.DOMStreams(window, document).size$

}) => {

    console.log('LayoutEngine')

    return {
        bounds$: tick$
    }
}
