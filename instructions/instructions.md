----------

### **# Project Overview**

**项目名称:** CalFood  
**描述:**  
CalFood 是一款基于 Next.js 的应用，通过调用 qwen 多模态模型（`qwen-vl-max-latest`）自动分析食物图片，返回食物各成分的名称、估计重量（克）、总热量以及**单位重量的热量（千卡/克）**。用户可查看并编辑分析结果，系统将基于单位热量动态更新总热量，并记录食物日志供后续查询。

**目标:**

-   利用 AI 图像识别简化食物日志录入流程。
-   提供详细的食物成分和营养信息，包括单位重量的热量。
-   支持用户对成分重量进行调整，并即时计算更新热量。
-   保存并管理用户的历史食物日志。

----------

### **# Features**

Feature

Description

Dependencies

**1. Capture Food Image**

允许用户通过设备相机或上传图片的方式获取食物照片。

Next.js, React, `react-webcam` 或浏览器 MediaDevices API

**2. Analyze Food using qwen**

将图片发送给 qwen 模型进行分析，返回食物成分、估计重量、总热量以及单位重量热量（千卡/克）。

Axios/Fetch, OpenAI SDK（调用 qwen 模型），Next.js API 路由

**3. Editable Analysis Results**

显示分析结果，并允许用户修改成分的重量。系统利用返回的单位重量热量实时重新计算该成分的热量以及所有成分的总热量。

React 状态管理、辅助计算函数

**4. Log & History Management**

保存用户确认后的食物日志，并提供历史日志查询功能。

Next.js API 路由、数据库或本地存储

----------

### **# Requirements for Each Feature**

#### **Feature 1: Capture Food Image**

-   **UI 组件:**
    
    -   **组件名称:** `FoodCapture`
    -   **UI 元素:** “Capture Food” 按钮
-   **功能说明:**
    
    -   用户点击按钮后，调用 `captureImage()` 函数启动相机（或弹出文件上传对话框）。
    -   使用 `navigator.mediaDevices.getUserMedia` 或 `react-webcam` 获取摄像头流，并捕获照片。
    -   将捕获的图片存入状态变量 `capturedImage`（可为 base64 或 Blob 数据）。
-   **错误处理:**
    
    -   当摄像头权限被拒或调用失败时，展示错误信息并允许重试。
-   **变量名称:**
    
    -   `capturedImage`: 存储捕获的图片数据。

----------

#### **Feature 2: Analyze Food using qwen**

-   **UI 组件:**
    
    -   **组件名称:** `FoodAnalysis`
    -   **UI 元素:** “Analyze Food” 按钮
-   **功能说明:**
    
    -   用户点击“Analyze Food”后，调用 `analyzeFood(capturedImage)` 函数。
    -   **内部流程：**
        1.  将图片数据上传至服务器（若需要，请先将图片存储至 CDN 或对象存储，并生成 URL）。
        2.  在 Next.js 后端 API `/api/analyze-food` 中调用 qwen 模型进行图像分析。
        3.  调用时传入 payload，示例代码如下：
            
            ```javascript
            import OpenAI from "openai";
            
            const openai = new OpenAI({
              // 若未配置环境变量，请直接用 "sk-xxx" 替换
              apiKey: process.env.DASHSCOPE_API_KEY,
              baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
            });
            
            async function analyzeFoodWithQwen(imageUrl) {
              const response = await openai.chat.completions.create({
                model: "qwen-vl-max-latest",
                messages: [
                  {
                    role: "system",
                    content: [{
                      type: "text",
                      text: "You are a helpful assistant."
                    }]
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "image_url",
                        image_url: { url: imageUrl }  // imageUrl 为上传后获取的图片 URL
                      },
                      {
                        type: "text",
                        text: "请分析图片中的食物，列出所有成分，并为每个成分提供估计重量（克）、热量（千卡）以及单位重量热量（千卡/克）。"
                      }
                    ]
                  }
                ]
              });
              return response.choices[0].message.content;
            }
            
            ```
            
        4.  将 qwen 返回的数据解析为统一格式，并存入状态变量 `analysisResults`。
-   **新增数据:**
    
    -   每个成分对象需包含字段 `caloriesPerGram`（单位：千卡/克），用于后续计算。
-   **依赖:**
    
    -   OpenAI SDK（npm 包 `openai`）
    -   Axios 或 Fetch API
    -   环境变量：`DASHSCOPE_API_KEY`（qwen 的 API Key）
-   **错误处理:**
    
    -   对 API 超时、图片无效或模型返回错误情况进行处理，并向用户展示友好提示。
-   **变量名称:**
    
    -   `analysisResults`: 存储从 qwen 返回的分析数据，每个对象格式示例：
        
        ```javascript
        {
          name: "Chicken",
          estimatedWeight: 150,    // 单位: 克
          calories: 240,           // 总热量（千卡）
          caloriesPerGram: 1.6     // 单位重量热量（千卡/克）
        }
        
        ```
        

----------

#### **Feature 3: Editable Analysis Results**

-   **UI 组件:**
    
    -   **组件名称:** `AnalysisResultsDisplay`
    -   **UI 元素:** 显示成分详情的表格或卡片组件，每个成分支持编辑重量
-   **功能说明:**
    
    -   将 `analysisResults` 渲染为可编辑列表或表格。
    -   用户修改成分的 `estimatedWeight` 时，调用 `recalcCalories(ingredient)` 函数，根据 **单位热量 (`caloriesPerGram`)** 重新计算该成分的 `calories`，计算公式：
        
        ```
        newCalories = newEstimatedWeight * caloriesPerGram
        
        ```
        
    -   动态更新并展示所有成分的总热量 `totalCalories`。
-   **变量名称:**
    
    -   `editedIngredients`: 存储用户修改后的成分数据
    -   `totalCalories`: 所有成分热量的动态汇总
-   **错误处理:**
    
    -   输入验证：确保重量输入为正数，超出合理范围时提示错误。

----------

#### **Feature 4: Log & History Management**

-   **UI 组件:**
    
    -   **组件名称:** `FoodLog`
    -   **UI 元素:** 食物日志列表或表格视图
-   **功能说明:**
    
    -   用户在确认分析结果后，点击“Save Log”按钮，调用 `saveLog(logData)` 函数。
    -   日志数据包含 `capturedImage`、`editedIngredients`（包括 `caloriesPerGram` 字段）、`totalCalories` 以及时间戳。
    -   通过 POST 请求提交至 `/api/food-logs` 保存日志数据。
    -   通过 GET 请求 `/api/food-logs` 实现日志分页查询和展示。
-   **数据模型:**
    
    ```javascript
    {
      id: string,
      timestamp: string,  // ISO8601 格式
      image: string,      // 图片 URL 或 base64 数据
      ingredients: [
        { name: string, weight: number, calories: number, caloriesPerGram: number }
      ],
      totalCalories: number
    }
    
    ```
    
-   **错误处理:**
    
    -   日志保存或查询失败时展示错误提示并允许用户重试。

----------

### **# API Contract**

#### **Endpoint 1: Analyze Food (调用 qwen 模型)**

**Endpoint**

POST `/api/analyze-food`

**Purpose**

接收前端上传的图片数据，并通过调用 qwen 模型获取食物分析结果，包括成分、估计重量、总热量及单位重量热量。

**Headers**

`Content-Type: application/json` 或 `multipart/form-data`（视上传方式而定）

**Request Body**

`json<br>{<br> "image": "base64EncodedImage 或 图片 URL",<br> "timestamp": "2025-02-14T12:34:56Z"<br>}<br>`

**Internal Processing**

后端接收到请求后：1. 若图片为 base64，则先上传至 CDN/对象存储获取 URL。2. 调用 qwen 模型，传入 payload：`javascript<br>{<br> model: "qwen-vl-max-latest",<br> messages: [<br> { role: "system", content: [{ type: "text", text: "You are a helpful assistant." }] },<br> {<br> role: "user",<br> content: [<br> { type: "image_url", image_url: { url: "上传后的图片URL" } },<br> { type: "text", text: "请分析图片中的食物，列出所有成分，并为每个成分提供估计重量（克）、热量（千卡）以及单位重量热量（千卡/克）。" }<br> ]<br> }<br> ]<br>}<br>`3. 解析 qwen 返回的内容，转换为统一格式，每个成分对象应包含 `caloriesPerGram` 字段。

**Success Response**

**HTTP 200 OK**`json<br>{<br> "ingredients": [<br> { "name": "Chicken", "estimatedWeight": 150, "calories": 240, "caloriesPerGram": 1.6 },<br> { "name": "Rice", "estimatedWeight": 200, "calories": 260, "caloriesPerGram": 1.3 }<br> ],<br> "totalCalories": 500<br>}<br>`

**Error Response**

**HTTP 400/500**`json<br>{ "error": "Invalid image data" }<br>`

----------

#### **Endpoint 2: Save Food Log**

**Endpoint**

POST `/api/food-logs`

**Purpose**

保存用户确认后的食物日志数据。

**Headers**

`Content-Type: application/json`

**Request Body**

`json<br>{<br> "image": "图片URL或base64数据",<br> "ingredients": [<br> { "name": "Chicken", "weight": 150, "calories": 240, "caloriesPerGram": 1.6 },<br> { "name": "Rice", "weight": 200, "calories": 260, "caloriesPerGram": 1.3 }<br> ],<br> "totalCalories": 500,<br> "timestamp": "2025-02-14T12:34:56Z"<br>}<br>`

**Success Response**

**HTTP 201 Created**`json<br>{ "id": "log123", "message": "Log saved successfully" }<br>`

**Error Response**

**HTTP 400/500**`json<br>{ "error": "Failed to save log" }<br>`

----------

#### **Endpoint 3: Retrieve Food Logs**

**Endpoint**

GET `/api/food-logs`

**Purpose**

获取保存的食物日志列表。

**Query Parameters**

可选参数：`page`, `limit` 用于分页。

**Success Response**

**HTTP 200 OK**`json<br>{<br> "logs": [<br> { "id": "log123", "timestamp": "2025-02-14T12:34:56Z", "totalCalories": 500, "image": "图片URL" },<br> ...<br> ]<br>}<br>`

**Error Response**

**HTTP 400/500**返回错误信息。

----------

### **Additional Notes & Considerations**

-   **Testing:**
    
    -   为 `captureImage()`、`analyzeFoodWithQwen()`、`recalcCalories()` 等函数编写单元测试。
    -   为 API 端点编写集成测试。
-   **环境变量:**
    
    -   将 qwen 的 API Key 存放于 `.env` 文件中（变量名：`DASHSCOPE_API_KEY`）。
    -   配置其他必要的环境变量（如图片存储服务的 API Key）。
-   **安全性:**
    
    -   验证并清洗上传图片，防止恶意数据注入。
    -   对 API 端点进行必要的认证和授权检查。
-   **Modularity & Readability:**
    
    -   每个组件应保持高度模块化，便于后续扩展。
    -   API 调用部分使用 try-catch 捕获异常，确保错误信息详细且用户友好。

