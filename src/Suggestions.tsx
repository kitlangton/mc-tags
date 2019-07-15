import React, { Component } from 'react'
import './App.css'
import _ from 'lodash'
import { Subject } from 'rxjs'

export type IKey = 'UP' | 'DOWN' | 'ENTER'

type ISuggestionProps = {
  query: string | null
  suggestions: string[]
  enterSubject: Subject<IKey>
  onSelect: (suggestion: string) => void
}

type ISuggestionState = {
  offset: null | { top: number; left: number }
  shown: boolean
  selectedIndex: number
}

export default class Suggestions extends Component<
  ISuggestionProps,
  ISuggestionState
> {
  state: ISuggestionState = {
    offset: null,
    shown: false,
    selectedIndex: 0
  }

  // Because the editor handles the keypresses
  componentDidMount() {
    this.props.enterSubject.subscribe(key => {
      let { selectedIndex } = this.state
      switch (key) {
        case 'ENTER':
          this.selectSuggestion()
          break
        case 'UP':
          this.changeSelectedIndex(-1)
          break
        case 'DOWN':
          this.changeSelectedIndex(1)
          break
      }
    })
  }

  selectSuggestion() {
    let suggestion = this.filteredSuggestions()[this.state.selectedIndex]
    if (suggestion) {
      this.props.onSelect(suggestion)
    }
  }

  changeSelectedIndex = (delta: 1 | -1) => {
    let { selectedIndex } = this.state
    let numberOfSuggestions = this.filteredSuggestions().length
    selectedIndex += delta
    if (selectedIndex < 0) {
      selectedIndex = numberOfSuggestions - 1
    } else if (selectedIndex >= numberOfSuggestions) {
      selectedIndex = 0
    }
    this.setState({ selectedIndex })
  }

  // Gets caret offset when first shown, to properly align suggestions div
  componentWillReceiveProps() {
    if (this.state.shown) return
    setTimeout(() => {
      let offset = caretPosition()
      if (offset) {
        offset.left += window.scrollX
        offset.top += window.scrollY + 20
        this.setState({ offset, shown: true })
      }
    }, 0)
  }

  // Filters suggestions using query
  filteredSuggestions = () => {
    const { suggestions, query } = this.props
    if (query) {
      return _.filter(suggestions, sug =>
        _.includes(sug.toLowerCase(), query.toLowerCase())
      )
    } else {
      return suggestions
    }
  }

  render() {
    const { offset } = this.state
    if (offset !== null) {
      return (
        <div
          className="suggestions"
          style={{ top: offset.top, left: offset.left }}
        >
          <div className="options">
            {this.filteredSuggestions().map((suggestion, idx) => (
              <div
                className={
                  'option ' +
                  (this.state.selectedIndex === idx ? 'option-selected' : '')
                }
                onMouseEnter={() => this.setState({ selectedIndex: idx })}
                onClick={() => this.selectSuggestion()}
                key={suggestion}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

// Fun thing from the internet, can probably simplify.
function caretPosition($node?: any, offsetx?: any, offsety?: any) {
  offsetx = offsetx || 0
  offsety = offsety || 0

  let nodeLeft = 0
  let nodeTop = 0
  if ($node) {
    nodeLeft = $node.offsetLeft
    nodeTop = $node.offsetTop
  }

  const pos = { left: 0, top: 0 }

  if ((document as any).selection) {
    const range = (document as any).selection.createRange()
    pos.left = range.offsetLeft + offsetx - nodeLeft
    pos.top = range.offsetTop + offsety - nodeTop
  } else if (window.getSelection) {
    const sel = window.getSelection()
    if (sel!.rangeCount === 0) return null
    const range = sel!.getRangeAt(0).cloneRange()

    try {
      range.setStart(range.startContainer, range.startOffset - 1)
    } catch (e) {}

    const rect = range.getBoundingClientRect()

    if (range.endOffset === 0 || range.toString() === '') {
      // first char of line
      if (range.startContainer === $node) {
        // empty div
        if (range.endOffset === 0) {
          pos.top = 0
          pos.left = 0
        } else {
          // firefox need this
          const range2 = range.cloneRange()
          range2.setStart(range2.startContainer, 0)
          const rect2 = range2.getBoundingClientRect()
          pos.left = rect2.left + offsetx - nodeLeft
          pos.top = rect2.top + rect2.height + offsety - nodeTop
        }
      } else {
        pos.top = (range.startContainer as any).offsetTop
        pos.left = (range.startContainer as any).offsetLeft
      }
    } else {
      pos.left = rect.left + rect.width + offsetx - nodeLeft
      pos.top = rect.top + offsety - nodeTop
    }
  }
  return pos
}
