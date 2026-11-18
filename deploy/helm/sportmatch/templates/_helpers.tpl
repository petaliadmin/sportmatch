{{- define "sportmatch.labels" -}}
app.kubernetes.io/part-of: sportmatch
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "sportmatch.image" -}}
{{- $root := index . 0 -}}{{- $name := index . 1 -}}
{{- if $root.Values.image.registry -}}
{{ $root.Values.image.registry }}/{{ $name }}:{{ $root.Values.image.tag }}
{{- else -}}
{{ $name }}:{{ $root.Values.image.tag }}
{{- end -}}
{{- end -}}
