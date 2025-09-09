# 🎨 UI Design System & Component Patterns

## 🎯 Monday.com Vibe Design System

### **Core Philosophy**

- **Consistency**: Use Vibe components for all UI elements
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Performance**: Optimized rendering and lazy loading
- **Theming**: Seamless integration with existing Pokemon/Magic/Lorcana themes

### **Component Dependencies**

```json
{
  "@vibe/core": "^3.56.3",
  "@vibe/icons": "^1.9.0",
  "@tremor/react": "^3.18.7",
  "monday-ui-style": "^0.25.2"
}
```

## 🧱 Core Components

### **Layout Components**

#### **Box - Primary Container**

```javascript
import { Box } from '@vibe/core';

// Basic container with consistent spacing
<Box padding={Box.paddings.LARGE} border={Box.borders.DEFAULT}>
  <content />
</Box>

// Responsive grid container
<Box
  display="flex"
  flexDirection="column"
  gap={Box.gaps.MEDIUM}
  className="responsive-container"
>
  <cards />
</Box>
```

#### **Flex - Layout Control**

```javascript
import { Flex } from '@vibe/core';

// Horizontal layout with spacing
<Flex direction={Flex.directions.ROW} gap={Flex.gaps.MEDIUM}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Flex>

// Vertical stack with alignment
<Flex
  direction={Flex.directions.COLUMN}
  align={Flex.align.START}
  justify={Flex.justify.CENTER}
>
  <content />
</Flex>
```

### **Typography Components**

#### **Heading - Section Headers**

```javascript
import { Heading } from '@vibe/core';

// Page titles
<Heading type={Heading.types.H1} color={Heading.colors.PRIMARY}>
  Card Management System
</Heading>

// Section headers
<Heading type={Heading.types.H2} weight={Heading.weights.MEDIUM}>
  Recent Cards
</Heading>

// Card titles
<Heading type={Heading.types.H3} ellipsis>
  {card.pokemon_name}
</Heading>
```

#### **Text - Body Content**

```javascript
import { Text } from '@vibe/core';

// Body text
<Text type={Text.types.TEXT1} color={Text.colors.SECONDARY}>
  {card.set_name}
</Text>

// Metadata/labels
<Text type={Text.types.TEXT2} color={Text.colors.ON_INVERTED}>
  Market Price: ${card.market_price}
</Text>

// Status indicators
<Text
  type={Text.types.TEXT2}
  color={status === 'active' ? Text.colors.POSITIVE : Text.colors.NEGATIVE}
  weight={Text.weights.MEDIUM}
>
  {status.toUpperCase()}
</Text>
```

### **Form Components**

#### **TextField - Primary Input**

```javascript
import { TextField } from '@vibe/core';

// Standard form input
<TextField
  placeholder="Search cards..."
  value={searchTerm}
  onChange={setSearchTerm}
  size={TextField.sizes.MEDIUM}
  iconName="Search"
/>

// Validation with error state
<TextField
  title="Pokemon Name"
  placeholder="Enter pokemon name"
  value={pokemonName}
  onChange={setPokemonName}
  validation={{ status: "error", text: "Required field" }}
  required
/>

// Number input for pricing
<TextField
  title="Market Price"
  type="number"
  placeholder="0.00"
  value={price}
  onChange={setPrice}
  prefix="$"
/>
```

#### **Dropdown - Selection Lists**

```javascript
import { Dropdown } from '@vibe/core';

// Card condition selector
<Dropdown
  placeholder="Select condition"
  options={[
    { label: "Mint", value: "mint" },
    { label: "Near Mint", value: "near_mint" },
    { label: "Excellent", value: "excellent" },
    { label: "Good", value: "good" },
    { label: "Played", value: "played" },
    { label: "Poor", value: "poor" }
  ]}
  value={condition}
  onChange={setCondition}
/>

// Multi-select for filtering
<Dropdown
  placeholder="Filter by sets"
  options={setOptions}
  value={selectedSets}
  onChange={setSelectedSets}
  multi
  multiline
/>
```

#### **Checkbox - Boolean Controls**

```javascript
import { Checkbox } from '@vibe/core'

// Single checkbox
;<Checkbox label="Include in quote" checked={includeInQuote} onChange={setIncludeInQuote} />

// Checkbox list for bulk actions
{
  cards.map((card) => (
    <Checkbox
      key={card.id}
      label={card.pokemon_name}
      checked={selectedCards.includes(card.id)}
      onChange={(checked) => toggleCardSelection(card.id, checked)}
    />
  ))
}
```

### **Action Components**

#### **Button - Primary Actions**

```javascript
import { Button } from '@vibe/core';

// Primary action button
<Button
  kind={Button.kinds.PRIMARY}
  size={Button.sizes.MEDIUM}
  onClick={handleSave}
  loading={saving}
>
  Save Card
</Button>

// Secondary actions
<Button
  kind={Button.kinds.SECONDARY}
  leftIcon="Upload"
  onClick={handleUpload}
>
  Upload Image
</Button>

// Destructive actions
<Button
  kind={Button.kinds.TERTIARY}
  color={Button.colors.NEGATIVE}
  onClick={handleDelete}
>
  Delete
</Button>
```

#### **IconButton - Compact Actions**

```javascript
import { IconButton } from '@vibe/core';

// Compact toolbar actions
<IconButton
  icon="Edit"
  ariaLabel="Edit card"
  onClick={handleEdit}
  size={IconButton.sizes.SMALL}
/>

<IconButton
  icon="Delete"
  ariaLabel="Delete card"
  onClick={handleDelete}
  kind={IconButton.kinds.SECONDARY}
/>
```

## 📊 Tremor React - Data Visualization

### **Chart Components**

Tremor React provides production-ready data visualization components optimized for business dashboards.

#### **AreaChart - Time Series Data**

```javascript
import { AreaChart, Card, Title } from '@tremor/react';

// Sales metrics over time
<Card>
  <Title>Sales Performance</Title>
  <AreaChart
    data={salesData}
    index="date"
    categories={["sales", "trade_ins"]}
    colors={["blue", "green"]}
    valueFormatter={(value) => `$${value.toLocaleString()}`}
    showLegend={true}
    showTooltip={true}
  />
</Card>

// Custom styling with Tremor colors
<AreaChart
  data={data}
  index="date"
  categories={["revenue"]}
  colors={["emerald"]}
  className="mt-6"
  yAxisWidth={60}
/>
```

#### **BarChart - Categorical Data**

```javascript
import { BarChart, Card, Title } from '@tremor/react'

// Card condition distribution
;<Card>
  <Title>Card Condition Breakdown</Title>
  <BarChart
    data={conditionData}
    index="condition"
    categories={['count']}
    colors={['blue']}
    valueFormatter={(value) => `${value} cards`}
    layout="vertical"
  />
</Card>
```

#### **DonutChart - Composition Analysis**

```javascript
import { DonutChart, Card, Title } from '@tremor/react'

// Set distribution
;<Card>
  <Title>Inventory by Set</Title>
  <DonutChart
    data={setDistribution}
    category="count"
    index="set_name"
    valueFormatter={(value) => `${value} cards`}
    colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
    className="mt-6"
  />
</Card>
```

#### **LineChart - Trend Analysis**

```javascript
import { LineChart, Card, Title } from '@tremor/react'

// Price trends over time
;<Card>
  <Title>Market Price Trends</Title>
  <LineChart
    data={priceHistory}
    index="date"
    categories={['average_price', 'high_price', 'low_price']}
    colors={['emerald', 'red', 'orange']}
    valueFormatter={(value) => `$${value}`}
    yAxisWidth={60}
  />
</Card>
```

### **Metric Components**

#### **Metric - Key Performance Indicators**

```javascript
import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react';

// Dashboard KPI card
<Card className="max-w-xs">
  <Text>Total Revenue</Text>
  <Metric>$12,426</Metric>
  <Flex className="mt-4">
    <Text>vs. last month</Text>
    <BadgeDelta deltaType="moderateIncrease">+12.3%</BadgeDelta>
  </Flex>
</Card>

// Multiple metrics in grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <Text>Cards Processed</Text>
    <Metric>{cardCount}</Metric>
    <Text className="mt-2">This month</Text>
  </Card>
  <Card>
    <Text>Average Sale Price</Text>
    <Metric>${avgPrice}</Metric>
    <BadgeDelta deltaType={deltaType}>
      {priceChange}%
    </BadgeDelta>
  </Card>
</div>
```

#### **ProgressBar - Progress Tracking**

```javascript
import { Card, Text, ProgressBar } from '@tremor/react'

// Processing progress
;<Card className="max-w-lg">
  <Text>OCR Processing Progress</Text>
  <ProgressBar value={processedCount} maxValue={totalCount} color="blue" className="mt-3" />
  <Text className="mt-2">
    {processedCount}/{totalCount} cards processed
  </Text>
</Card>
```

### **Data Integration Patterns**

#### **Dashboard Layout with Tremor + Vibe**

```javascript
import { Box, Heading, Flex } from '@vibe/core'
import { Card, Title, AreaChart, Metric } from '@tremor/react'

const DashboardPage = ({ salesData, metrics }) => (
  <Box padding={Box.paddings.LARGE}>
    <Heading type={Heading.types.H1}>Dashboard</Heading>

    {/* KPI Section with Tremor metrics */}
    <Flex className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {metrics.map((metric) => (
        <Card key={metric.name}>
          <Text>{metric.name}</Text>
          <Metric>{metric.value}</Metric>
          <BadgeDelta deltaType={metric.deltaType}>{metric.change}</BadgeDelta>
        </Card>
      ))}
    </Flex>

    {/* Chart Section */}
    <Box className="mt-8">
      <Card>
        <Title>Sales Performance</Title>
        <AreaChart
          data={salesData}
          index="date"
          categories={['sales', 'trade_ins']}
          colors={['blue', 'green']}
        />
      </Card>
    </Box>
  </Box>
)
```

#### **Responsive Chart Patterns**

```javascript
// Mobile-optimized chart configuration
const chartConfig = {
  mobile: {
    yAxisWidth: 40,
    showLegend: false,
    className: 'h-60',
  },
  desktop: {
    yAxisWidth: 60,
    showLegend: true,
    className: 'h-80',
  },
}

;<AreaChart
  data={data}
  index="date"
  categories={categories}
  {...(isMobile ? chartConfig.mobile : chartConfig.desktop)}
/>
```

### **Tremor Color Palette**

```javascript
// Use Tremor's semantic colors for consistency
const tremorColors = [
  'blue',
  'emerald',
  'violet',
  'amber',
  'red',
  'rose',
  'green',
  'yellow',
  'orange',
  'cyan',
  'pink',
  'lime',
  'fuchsia',
  'indigo',
  'sky',
  'teal',
]

// Color mapping for business data
const categoryColors = {
  sales: 'emerald',
  trade_ins: 'blue',
  inventory: 'violet',
  quotes: 'amber',
  expenses: 'red',
}
```

## 📋 Data Display Components

### **Table - Structured Data**

```javascript
import { Table } from '@vibe/core'

const cardColumns = [
  {
    id: 'pokemon_name',
    title: 'Pokemon',
    width: 200,
    loadingStateType: 'medium-text',
  },
  {
    id: 'set_name',
    title: 'Set',
    width: 150,
    loadingStateType: 'medium-text',
  },
  {
    id: 'market_price',
    title: 'Price',
    width: 100,
    loadingStateType: 'medium-text',
  },
]

;<Table columns={cardColumns} data={cards} loading={loading} onRowClick={handleRowClick} />
```

### **List - Card Collections**

```javascript
import { List } from '@vibe/core'

// Card list with actions
;<List>
  {cards.map((card) => (
    <List.Item key={card.id}>
      <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER}>
        <Box>
          <Heading type={Heading.types.H4}>{card.pokemon_name}</Heading>
          <Text type={Text.types.TEXT2}>{card.set_name}</Text>
        </Box>
        <Text type={Text.types.TEXT1} weight={Text.weights.MEDIUM}>
          ${card.market_price}
        </Text>
      </Flex>
    </List.Item>
  ))}
</List>
```

## 🔔 Feedback Components

### **Toast - Status Messages**

```javascript
import { Toast } from '@vibe/core'

// Success notification
Toast.show({
  message: 'Card saved successfully',
  type: Toast.types.POSITIVE,
  autoHideDuration: 3000,
})

// Error notification
Toast.show({
  message: 'Failed to upload image',
  type: Toast.types.NEGATIVE,
  autoHideDuration: 5000,
})

// Info notification
Toast.show({
  message: 'Processing card identification...',
  type: Toast.types.NORMAL,
  autoHideDuration: 2000,
})
```

### **LoadingSpinner - Async States**

```javascript
import { Loader } from '@vibe/core';

// Page loading
<Loader size={Loader.sizes.LARGE} />

// Inline loading
<Loader size={Loader.sizes.SMALL} />

// Button loading state
<Button loading={processing}>
  Process Card
</Button>
```

## 🎨 Theme Integration

### **Existing Theme Compatibility**

```javascript
// Themes work seamlessly with Vibe components
<Box className="pokemon-theme">
  <Button kind={Button.kinds.PRIMARY}>Pokemon Action</Button>
</Box>

<Box className="magic-theme">
  <Button kind={Button.kinds.PRIMARY}>Magic Action</Button>
</Box>

<Box className="lorcana-theme">
  <Button kind={Button.kinds.PRIMARY}>Lorcana Action</Button>
</Box>
```

### **Custom Styling**

```css
/* Use CSS custom properties for theme consistency */
.card-container {
  background: var(--primary-background-color);
  border: 1px solid var(--ui-border-color);
  border-radius: var(--border-radius-small);
}

.status-active {
  color: var(--positive-color);
}

.status-inactive {
  color: var(--negative-color);
}
```

## 📱 Responsive Patterns

### **Mobile-First Design**

```javascript
// Responsive layout patterns
<Box className="responsive-grid">
  <Box className="grid-item">
    <TextField placeholder="Search..." />
  </Box>
  <Box className="grid-item">
    <Button>Filter</Button>
  </Box>
</Box>
```

```css
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-medium);
}

@media (max-width: 768px) {
  .responsive-grid {
    grid-template-columns: 1fr;
  }
}
```

### **Touch-Friendly Interactions**

```javascript
// Larger touch targets on mobile
<IconButton
  icon="Edit"
  size={isMobile ? IconButton.sizes.LARGE : IconButton.sizes.MEDIUM}
  onClick={handleEdit}
/>
```

## 🏗️ Component Composition Patterns

### **Card Display Component**

```javascript
const CardDisplay = ({ card, onEdit, onDelete }) => (
  <Box padding={Box.paddings.MEDIUM} border={Box.borders.DEFAULT}>
    <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.SMALL}>
      <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.START}>
        <Box>
          <Heading type={Heading.types.H3} ellipsis>
            {card.pokemon_name}
          </Heading>
          <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
            {card.set_name}
          </Text>
        </Box>
        <Flex gap={Flex.gaps.SMALL}>
          <IconButton icon="Edit" onClick={() => onEdit(card.id)} />
          <IconButton icon="Delete" onClick={() => onDelete(card.id)} />
        </Flex>
      </Flex>

      <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER}>
        <Text type={Text.types.TEXT1} weight={Text.weights.MEDIUM}>
          ${card.market_price}
        </Text>
        <Text
          type={Text.types.TEXT2}
          color={card.condition === 'mint' ? Text.colors.POSITIVE : Text.colors.SECONDARY}
        >
          {card.condition}
        </Text>
      </Flex>
    </Flex>
  </Box>
)
```

### **Form Section Pattern**

```javascript
const FormSection = ({ title, children }) => (
  <Box padding={Box.paddings.LARGE} border={Box.borders.DEFAULT}>
    <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.MEDIUM}>
      <Heading type={Heading.types.H2} color={Heading.colors.PRIMARY}>
        {title}
      </Heading>
      {children}
    </Flex>
  </Box>
)

// Usage
;<FormSection title="Card Details">
  <TextField title="Pokemon Name" />
  <TextField title="Set Name" />
  <Dropdown title="Condition" options={conditionOptions} />
</FormSection>
```

### **Tremor + Vibe Integration Best Practices**

#### **Consistent Design System Usage**

```javascript
// ✅ Combine Tremor charts with Vibe layout components
import { Box, Heading, Flex } from '@vibe/core';
import { Card, AreaChart, Metric } from '@tremor/react';

<Box padding={Box.paddings.LARGE}>
  <Heading type={Heading.types.H2}>Analytics</Heading>
  <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.LARGE}>
    <Card>
      <Metric>$12,345</Metric>
      <AreaChart data={data} />
    </Card>
  </Flex>
</Box>

// ❌ Don't mix Tremor layout with Vibe charts
<Card> {/* Tremor Card */}
  <Box> {/* Vibe Box inside Tremor Card - inconsistent */}
    <CustomChart /> {/* Non-Tremor chart */}
  </Box>
</Card>
```

#### **Color Consistency**

```javascript
// ✅ Use Tremor's semantic colors for charts
<AreaChart
  data={salesData}
  colors={["emerald", "blue"]} // Tremor colors
/>

// ✅ Match Tremor colors with CSS for non-chart elements
<Text className="text-emerald-600">Positive metric</Text>
<Text className="text-red-600">Negative metric</Text>

// ❌ Don't use inconsistent color systems
<AreaChart colors={["#FF5733", "#33FF57"]} /> // Custom hex colors
```

## 🚨 Component Anti-Patterns

### **Avoid These Mistakes**

```javascript
// ❌ Don't use raw HTML elements
<input type="text" /> // Use TextField instead

// ❌ Don't use inline styles
<div style={{ padding: '16px' }}> // Use Box with padding props

// ❌ Don't mix design systems
<Button>Vibe Button</Button>
<button className="custom-btn">Custom Button</button> // Inconsistent

// ❌ Don't ignore loading states
<Button onClick={asyncAction}>Save</Button> // Should show loading

// ❌ Don't use non-Tremor charts for data visualization
<CustomLineChart data={data} /> // Use Tremor's LineChart instead

// ✅ Correct approach
<TextField placeholder="Search..." />
<Box padding={Box.paddings.MEDIUM}>
<Button loading={isLoading} onClick={asyncAction}>Save</Button>
<AreaChart data={data} colors={["emerald"]} />
```

## ✅ Component Checklist

### **Before Component Completion**

- [ ] Uses Vibe Design System components for UI controls
- [ ] Uses Tremor React components for data visualization
- [ ] Handles loading states appropriately
- [ ] Includes error state handling
- [ ] Responsive design considered
- [ ] Accessibility attributes included
- [ ] Theme compatibility maintained
- [ ] Consistent with existing patterns
- [ ] Color consistency between Tremor and Vibe components

### **Performance Considerations**

- [ ] Memoization for expensive renders
- [ ] Debounced search/filter inputs
- [ ] Lazy loading for large lists
- [ ] Efficient re-rendering patterns

---

**Version**: 2025-08-10 | **Previous**: 2025-08-01 | **Major Changes**: Added comprehensive Tremor React documentation for data visualization, integration patterns with Vibe Design System, color consistency guidelines, and updated component checklist
