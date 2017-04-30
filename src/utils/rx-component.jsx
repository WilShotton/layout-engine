import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'

const propAsStreamFilter = stream$ => stream$.distinctUntilChanged(_.identity, _.isEqual)

class RxComponent extends React.Component{

    constructor(props) {

        super(props)

        this.on = {}

        this.__disposable = new Rx.Subject()
        this.__eventSubject = new Rx.Subject()
        this.__propsSubject = new Rx.Subject()

        this.props$ = this.__propsSubject.startWith(this.props)

        this.propAsStream = _.memoize(

            (key, filter=propAsStreamFilter) => {

                return this.props$
                    .pluck(key)
                    .let(filter)
                    .startWith(this.props[key])
                    .share()
            },

            (key, filter) => {

                return `${key}-${String(filter)}`
            }
        )

        this.stateObserver = Rx.Subscriber.create(
            state => {
                this.setState(state)
            },
            error => {
                // TODO: Maybe set the state.error to true?
                // Log exception
                console.log(error)
            },
            () => {
                throw new Error('Your stateObserver completed in component "'
                    + this.constructor.displayName
                    + '". Not good. Put .concat(Rx.Observable.never()) before .subscribe(this.stateObserver) call.')
            }
        )
    }

    componentWillReceiveProps(props) {

        this.__propsSubject.next(props)
    }

    componentWillUnmount() {

        this.__disposable.unsubscribe()
        this.__eventSubject.unsubscribe()
        this.__propsSubject.unsubscribe()
        this.stateObserver.unsubscribe()
    }

    // Disposable
    // --------------------
    addDisposables(...args) {

        _.forEach(args, disposable => this.__disposable.subscribe(disposable))
    }

    // Events
    // --------------------
    createHandlers(keys, payloadMapping={}) {

        _.forEach(keys, key => {

            this.on[key] = this.mapEvent(key, payloadMapping
                ? payloadMapping[key]
                : null
            )
        })
    }

    event(eventName) {

        return this.__eventSubject
            .filter(({name}) => name === eventName)
            .pluck('e')
    }

    mapEvent(name, payload) {

        return sourceEvent => {

            const event = payload
                ? { ...sourceEvent, payload }
                : sourceEvent

            this.__eventSubject.next({
                e: event,
                name
            })
        }
    }

    // @TODO: Lifecycle
    // --------------------
}

export default RxComponent
