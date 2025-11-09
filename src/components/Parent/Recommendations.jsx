import { useState } from 'react'
import './ParentComponents.css'

const Recommendations = () => {
  const [selectedAge, setSelectedAge] = useState('3-5')

  const categories = [
    { id: 'learning', name: 'Обучение и развитие', topics: ['Алфавит', 'Цифры', 'Цвета', 'Формы'] },
    { id: 'creativity', name: 'Творчество', topics: ['Рисование', 'Лепка', 'Поделки', 'Музыка'] },
    { id: 'science', name: 'Наука', topics: ['Природа', 'Животные', 'Космос', 'Эксперименты'] },
    { id: 'stories', name: 'Сказки и истории', topics: ['Русские сказки', 'Мировые сказки', 'Стихи'] },
    { id: 'physical', name: 'Физическая активность', topics: ['Зарядка', 'Танцы', 'Игры'] }
  ]

  const ageGroups = [
    { value: '0-2', label: '0-2 года' },
    { value: '3-5', label: '3-5 лет' },
    { value: '6-8', label: '6-8 лет' },
    { value: '9-12', label: '9-12 лет' }
  ]

  const handleTopicClick = (topic) => {
    console.log('Поиск по теме:', topic, 'возраст:', selectedAge)
    // TODO: Выполнить поиск видео по выбранной теме
  }

  return (
    <div className="recommendations">
      <h2>Рекомендации по темам</h2>
      <p className="section-description">
        Подборки тем для развития ребенка по возрастам
      </p>

      <div className="age-selector">
        <label>Возраст ребенка:</label>
        <div className="age-buttons">
          {ageGroups.map((age) => (
            <button
              key={age.value}
              className={`age-button ${selectedAge === age.value ? 'active' : ''}`}
              onClick={() => setSelectedAge(age.value)}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>

      <div className="categories">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <h3 className="category-title">{category.name}</h3>
            <div className="topics">
              {category.topics.map((topic) => (
                <button
                  key={topic}
                  className="topic-button"
                  onClick={() => handleTopicClick(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recommendations
