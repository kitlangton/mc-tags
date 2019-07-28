import './App.css'

import React, { useState } from 'react'
import { Subject } from 'rxjs'
import { Inline, SchemaProperties, Value } from 'slate'
import { Editor, EventHook, RenderInlineProps } from 'slate-react'

import Suggestions, { IKey } from './Suggestions'

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: []
      }
    ]
  }
})

const TokenNode = (props: RenderInlineProps) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="hello"
      contentEditable={false}
      {...props.attributes}
      onClick={() => setExpanded(!expanded)}
      style={{
        display: 'inline',
        padding: expanded ? '3px 10px' : '3px 5px',
        backgroundColor: props.isFocused
          ? 'rgb(0, 150, 186)'
          : 'rgba(20, 180, 236, 0.7)',
        color: 'rgba(0,0,0,0.7)',
        borderRadius: 3,
        verticalAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        userSelect: 'none',
        fontWeight: 'bold'
      }}
    >
      {props.node.data.get('name')}
    </div>
  )
}

class App extends React.Component {
  state = {
    value: initialValue,
    query: null,
    showSuggestions: false
  }

  editor: Editor | null = null
  enterSubject = new Subject<IKey>()

  getQuery = (value: Value): string | null => {
    let {
      focusText: { text },
      selection: {
        focus: { offset }
      }
    } = value

    let prevText = text.slice(0, offset + 1)
    let start = prevText
      .split('')
      .reverse()
      .join('')
      .indexOf('/')

    if (start > -1) {
      return prevText.slice(offset - start)
    }
    {
      return null
    }
  }

  onChange = ({ value }: { value: Value }) => {
    let { showSuggestions } = this.state
    let query = null

    if (showSuggestions) {
      query = this.getQuery(value)
      if (query === null) {
        showSuggestions = false
      }
    }

    this.setState({ value, showSuggestions, query })
  }

  handleBlur: EventHook = (event, editor, next) => {
    if (this.state.showSuggestions) {
      setTimeout(() => {
        this.setState({ showSuggestions: false, query: null })
      }, 100)
    } else {
      next()
    }
  }

  handleSelect = (suggestion: string) => {
    let query = this.getQuery(this.state.value)
    if (query === null) return

    this.editor!.deleteBackward(query.length + 1)
      .insertInline({
        type: 'token',
        data: {
          name: suggestion
        }
      })
      .moveForward()
  }

  dumbAndroid = () => {
    this.setState({ showSuggestions: true }, () => {
      setTimeout(() => {
        this.editor!.insertText('/')
        this.editor!.focus()
      }, 50)
    })
  }

  onKeyDown: EventHook = (e: any, editor, next) => {
    let event: KeyboardEvent = e

    if (this.state.showSuggestions) {
      if (event.key === 'Enter') {
        this.enterSubject.next('ENTER')
        event.preventDefault()
        return
      }
      if (event.key === 'ArrowUp') {
        this.enterSubject.next('UP')
        event.preventDefault()
        return
      }
      if (event.key === 'ArrowDown') {
        this.enterSubject.next('DOWN')
        event.preventDefault()
        return
      }
    }

    if (event.key === '/') {
      this.setState({ showSuggestions: true })
    }

    next()
  }

  onInput = (e: any) => {
    e.persist()
    console.log('INPUT', e)
  }

  renderBlock = (props: RenderInlineProps, editor: any, next: any) => {
    switch (props.node.type) {
      case 'token':
        return <TokenNode {...props} />
      default:
        return next()
    }
  }

  render = () => (
    <div className="App">
      <Editor
        className="editor"
        value={this.state.value}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        onBlur={this.handleBlur}
        onInput={this.onInput}
        ref={editor => (this.editor = editor)}
        renderInline={this.renderBlock}
        schema={schema}
        autoFocus
        autoCorrect={false}
      />

      <button onClick={this.dumbAndroid}>I'M DUMB</button>

      {this.state.showSuggestions && (
        <Suggestions
          query={this.state.query}
          suggestions={[
            'Cool Company',
            'Whirling Dervish Inc',
            'Potato Purveyors',
            'Coca-Cola',
            'Forge'
          ]}
          enterSubject={this.enterSubject}
          onSelect={this.handleSelect}
        />
      )}

      {this.state.value.blocks.first() && (
        <pre>
          {this.state.value.blocks.first().nodes.map(n => {
            if (n instanceof Inline) {
              return JSON.stringify(n.data)
            } else {
              return n!.text
            }
          })}
        </pre>
      )}
    </div>
  )
}

const schema: SchemaProperties = {
  document: {
    nodes: [
      {
        match: [{ type: 'paragraph' }]
      }
    ]
  },
  inlines: {
    token: {
      isVoid: true,
      data: {
        name: (v: any) => {
          return true
        }
      }
    }
  },
  blocks: {
    paragraph: {
      nodes: [
        {
          match: [{ object: 'text' }, { type: 'token' }]
        }
      ]
    }
  }
}

export default App
