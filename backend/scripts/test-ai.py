from google.cloud import aiplatform

def predict_textembedding():
    project_id = "vivo-learning"
    location = "us-central1"
    model_id = "textembedding-gecko@001"
    input_text = "This is a test input."

    # Initialize the PredictionServiceClient
    client = aiplatform.gapic.PredictionServiceClient()

    # Endpoint for the model
    endpoint = f"projects/{project_id}/locations/{location}/publishers/google/models/{model_id}"

    # Prepare instances for prediction
    instances = [{"content": input_text}]

    # Make the prediction request
    response = client.predict(endpoint=endpoint, instances=instances)
    print("Predictions:", response.predictions)

predict_textembedding()
