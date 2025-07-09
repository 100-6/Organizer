// front-end/src/pages/Home/components/TodoMockup.tsx
import './TodoMockup.css'

interface TodoItem {
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

interface TodoMockupProps {
  todos: TodoItem[]
  onTodoToggle: (id: number) => void
}

const TodoMockup = ({ todos, onTodoToggle }: TodoMockupProps) => {
  return (
    <div className="todo-mockup">
      <div className="todo-header">
        <h3>Aujourd'hui</h3>
        <span className="todo-date">Mar 8 Jan</span>
      </div>
      
      {todos.map((todo) => (
        <div key={todo.id} className="todo-item">
          <div 
            className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
            onClick={() => onTodoToggle(todo.id)}
          />
          <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
            {todo.text}
          </span>
          <div className={`todo-priority priority-${todo.priority}`} />
        </div>
      ))}
    </div>
  )
}

export default TodoMockup