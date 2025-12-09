while IFS='=' read -r key value || [[ -n "$key" ]]; do
    echo "SECRET_$key=$(echo -n "$value" | base64)";
done < .env.kestra > .env.kestra.encoded